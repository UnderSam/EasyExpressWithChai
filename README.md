# Basic Jenkins CI/CD with Node.js Server

## What's CI/CD ?

DevOps的基本功，目的是達到***持續性的驗證系統開發結果且執行自動部屬***，每一次的 Commit 都要經過自動測試的驗證，小部分的盡早確認來符合開發需求，且在產品需要改變時能快速修正。簡單來說就是可以盡量減少能力，將除了開發之外的流程都交給自動化來處理。

### CI (Continuous Integration)

* 流程 : 
    * 【程式建置】
    開發人員在每一次的 Commit & Push 之後，就會經由版本管理工具來觸發自動建置(這邊是用 Jenkins)，這樣能夠在統一的環境自動 Build 程式，最大化避免不同開發人員的系統環境差異。
    * 【程式測試】
    經過 Jenkins 自動 Build 之後，便會進行程式測試，測試方面可以分很多種: Unit Test/Integration Test/E2E Test/...，這邊就會經由撰寫腳本的方式來讓 Jenkins 去自動執行，若通過此階段便會將當次的 Build 標記為 **成功**。
![](https://i.imgur.com/e5rJ3SJ.png)

### CD (Continuous Deployment)

* 流程 : 
    * 【自動部屬】
    透過自動化方式，將程式碼部屬到 Production 環境中，這邊通常會搭配 CI 的自動驗證來確保程式碼的品質，且也會透過系統監控來觀察服務是否異常。

### Continuous Delivery VS Continuous Deployment

![](https://i.imgur.com/fpC4Ckq.png)
(取自網路)

### CI/CD 大致流程圖

![](https://i.imgur.com/v8xN2xb.png)

(取自網路)

## Why CI/CD ?

### CI Benefits: 

* 較少的 Bugs
* 減少人工手動的繁雜程序
* 可以隨時產生一版可以交付的版本
* 建立團隊信心

### CD Benefits: 

* 客戶 ~~不會靠夭沒有進步~~ 能夠感受到持續性的改善
* 相對安全 & 快速的 release
* 最大化收益 (複利效果?)


## What are we going to build?

![](https://i.imgur.com/IXiNtQA.png)
(取自網路)

## Create Node App

這邊我們用 Express 搭配簡單的 JSON 資料來建立一個只輸出資料的 API Server，資料夾分配如下 : 

```
controllers/
--productController.js
dummies/
--products.js
routes/
--index.js
tests/
--test.js
.babelrc
server.js
package.json
```

資料的部分則是如下 : 

```javascript=
//products.js
const products = [
    {
      id: 1,
      name: 'Apple',
    },
    {
      id: 2,
      name: 'Orange',
    },
    {
      id: 3,
      name: 'Pineapple',
    }
 ];
 export default products;
```
controller, route 還有 server.js 的部分就是非常基本的 Express

Controller : 
```javascript=
import products from '../dummies/products.js';
class ProductController {
    // Get all products
    static getAllProducts(req, res) {
          return res.status(200).json({
                products,
                message: "All the products",
          });
    }
    // Get a single product
    static getSingleProduct(req, res) {
           const findProduct = products.find(product => product.id === parseInt(req.params.id, 10));
           if (findProduct) {
               return res.status(200).json({
                     student: findProduct,
                     message: "A single product record",
               });
           }
           return res.status(404).json({
                 message: "record not found",
           });
    }
}
export default ProductController;
```

routes : 
```javascript=
import { Router } from 'express';
import ProductController from '../controllers/productController.js';
const routes = Router();
routes.get('/', ProductController.getAllProducts);
routes.get('/:id', ProductController.getSingleProduct);
export default routes;
```

server : 
```javascript=
import express from 'express';
import bodyParser from 'body-parser';
import routes from './routes/index';
// Instantiate express
const app = express();
// Set our port
const port = 5487;
// Configure app to user bodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Register our routes in app
app.use('/', routes);
// Start our server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
// Export our app for testing purposes
export default app;
```
都建立起來後，就可以用 Postman 測試看看可不可以 work

全部產品的 API:
![](https://i.imgur.com/rjokkih.png)

單一產品的 API:
![](https://i.imgur.com/wDZ3PSp.png)

錯誤產品的報錯 API:
![](https://i.imgur.com/vyU7bIA.png)

## Use Mocha/Chai to do some unit test

利用 Postman 測試輸出正常後，我們就可以開始寫 unit test 讓程式幫我們做測試，為了確保每次的開發不出錯，記得在撰寫 test case 的時候考慮 edge case。

```javascript=
//test.js
import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';
// Configure chai
chai.use(chaiHttp);
chai.should();
describe("Products", () => {
    describe("GET /", () => {
        // Test to get all products record
        it("should get all products record", (done) => {
             chai.request(app)
                 .get('/')
                 .end((err, res) => {
                     res.should.have.status(200);
                     res.body.should.be.a('object');
                     done();
                  });
         });
        // Test to get single product record
        it("should get a single product record", (done) => {
             const id = 1;
             chai.request(app)
                 .get(`/${id}`)
                 .end((err, res) => {
                     res.should.have.status(200);
                     res.body.should.be.a('object');
                     done();
                  });
         });
         
        // Test to get single product record
        it("should not get a single product record", (done) => {
             const id = 4;
             chai.request(app)
                 .get(`/${id}`)
                 .end((err, res) => {
                     res.should.have.status(404);
                     done();
                  });
         });
    });
});
```

這邊簡單的想就是用 chai http 來幫我們對剛剛建立的 App 發送定義好的 request，第一個 request 是希望得到全部的資料，但是資料是變動的，所以我們只會讓預期 Output 是一個 Object 且 status 要是 200，而第二個 request 則是要發送特定的 id 得到一個 Object，比較特別的是第三個 request，要測試若發出一個超過 data 的 index 就要得到 status 404，更多詳細的測試方法可以自行 Google express stub/mock/... 等關鍵字。

![](https://i.imgur.com/FT3vKnu.png)
(npm run test 結果)
## Jenkins

![](https://i.imgur.com/vILlXRe.png)


 用 Java 編寫的開源的持續整合工具，在專案進行開發前，使用者首先要將運作環境建置完成，而在自動化建置的過程中，使用者可以透過 Jenkins 完成此步驟。在專案中套件或函式庫版本變更時，可以透過 Jenkins 確保更新的過程沒有錯誤。

隨著開發方法逐漸往[測試驅動開發(Test-driven development, TDD](https://tw.alphacamp.co/blog/tdd-test-driven-development-example))，Jenkins 的存在也就變得得更重要，開發人員只要將單元測試以及整合測試全部交給 Jenkins 自動執行就好，所有的執行過程以及結果也都可以透過不同的 Plugin 通知(via Telegram/Slack/Email)使用者是否成功。

## Create Jenkins Server

這邊我們直接使用 Docker 來建置 Jenkins Server，指令如下 : 
```bash=
docker run \
  --name jenkins \
  -u root \
  -d \
  -p 8080:8080 \
  -p 50000:50000 \
  -e TZ="Asia/Taipei" \
  -v /home/etl/data/jenkins:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart=on-failure:10 \
  jenkinsci/blueocean
```

等待 docker 建置完後就可以直接連到 localhost:8080，並且會要你輸入解鎖密碼

![](https://i.imgur.com/TGHlp92.png)

這時候只要進去 Docker container 把密碼貼出來即可開始使用 Jenkins。

指令 : 
```bash=
docker exec -it <Docker Container ID> bash
cat /var/jenkins_home/secrets/initialAdminPassword
```

選擇安裝 suggested plugins

![](https://i.imgur.com/drREvOO.png)

安裝完後就會看到主頁面

![](https://i.imgur.com/8XPrkuT.png)

## Pipeline

用 Groovy 撰寫的腳本語言，可以撰寫成 Jenkinsfile，也可以直接在新建工作時直接寫入程式碼，讓 Jenkins CI/CD 流程更強大，並搭配 Jenkins 內建的 Build Trigger 來啟動。

```
pipeline {
    stages {
        stage('Stage 1'){
            echo 'Hello World 1'
       }
        stage('Stage 2'){
            echo 'Hello World 2'
       }
    }
}
```

接下來就要開啟一個 Pipeline Project，以下用圖片來說明 : 

![](https://i.imgur.com/rbH910J.png)

![](https://i.imgur.com/LR9RdB4.png)

因為 Github 的部分設定比較複雜，接下來就先處理 Pipeline 的部分就好，這邊直接把畫面拉到 **Pipeline** 開始寫 task。


在學習寫 Pipeline 的時候我們可以一個步驟一個步驟做，每次加完一個 stage 就 build 一次，搭配 console output 就很容易了解中間發生的事情。

```
pipeline {
    agent {
        docker {
            image 'node:10.20.1-alpine3.11' 
            args '-v $HOME/.m2:/root/.m2'
        }
    }
    stages {
        stage('checkout') {
            steps {
                git 'https://github.com/UnderSam/EasyExpressWithChai'
            }
        }
    }
}
```
* Pipeline 有一個非常方便的地方，就是可以直接指定 docker agent 來建立執行環境，這樣一來我們的測試 Server 就不用裝一堆有的沒的環境了
* 這邊我們就先簡單拉 git 下來，語法如果不會的話也可以選 pipeline syntax 幫你產生語法

設定完就可以按 Save 然後直接點擊 Build Now 手動觸發，等待 Build 完後就可以點進去 #1 中的 Pipeline Steps 看過程。

![](https://i.imgur.com/lrzFZpj.png)
(可以在 Pipeline 首頁看到 Build History)

![](https://i.imgur.com/uBJqUMO.png)
(點進去每個 Build 也可以看到 Pipeline Steps)

看完沒問題後，就可以點進去 WorkSpace 確認檔案是否正常。

![](https://i.imgur.com/ElszzQV.png)

![](https://i.imgur.com/UPVaQuP.png)
(這邊因為是同一個 Project，所以會有後面我在測試時產生的 build 跟 node_modules，若只有 pull github 的話不會有這兩個資料夾)

接下來可以把 test 跟 build 也一起加進來 Pipeline 中

```
pipeline {
    agent {
        docker {
            image 'node:10.20.1-alpine3.11' 
            args '-v $HOME/.m2:/root/.m2'
        }
    }
    stages {
        stage('checkout') {
            steps {
                git 'https://github.com/UnderSam/EasyExpressWithChai'
            }
        }
        stage('test') {
            steps {
                sh 'npm install'
                sh 'npm run test'
            }
        }
        stage('build') {
            steps {
                sh 'npm run build'
            }
        }
    }
}
```

這次，我們可以透過 build info 中的 console output 來觀看每個 Steps 有沒有成功

docker

![](https://i.imgur.com/gNDEyX9.png)

git

![](https://i.imgur.com/pj0zmnI.png)

npm install

![](https://i.imgur.com/X94c81O.png)

npm run test

![](https://i.imgur.com/R7nWoK2.png)

build

![](https://i.imgur.com/KGn0E22.png)

確認完沒問題之後就可以來撰寫 SSH Publisher 跟 Github Hook 的部分。

## Set up SSH connect from Jenkins Server to Prod Server

因為之後自動化會要讓 Jenkins Server 自動將 Build 檔案 publish 到 Prod Server，因此要先設定讓 Jenkins 能夠連線到 Prod Server。

首先要下載 Publish over SSH 這個 Plugin，它會幫助我們在 pipeline 階段直接把 build 過後的檔案傳送到 Prod 的專案資料夾底下。(路徑: Jenkins->Plugin Manager->Available 搜尋 Publish Over SSH->Install)

![](https://i.imgur.com/fwKhzWC.png)

下載完後重新啟動 Jenkins 後就可以來到 Configure System 來新增 SSH config。這邊記得先把 Jenkins Server 的 pub key 放到 Remote Server 的 ~/.ssh/authorized_keys 底下，詳細設定可以[參考這篇](https://xenby.com/b/220-%E6%95%99%E5%AD%B8-%E7%94%A2%E7%94%9Fssh-key%E4%B8%A6%E4%B8%94%E9%80%8F%E9%81%8Ekey%E9%80%B2%E8%A1%8C%E5%85%8D%E5%AF%86%E7%A2%BC%E7%99%BB%E5%85%A5)。

![](https://i.imgur.com/1PYjQMd.png)
* Key: Jenkin Server 的 RSA Private key
* Name: 要給該 Prod Server 的一個名字
* Hostname: Prod Server 連線位址
* Username: 要在 Prod Server 登入的 user
* Remote Directory: 連線過去後 Prod Server 存放檔案的位置(必須存在)

設定完可以點 Test Configuration，若成功就會跑出 Success。

接下來回到 Project Configure 選擇 Pipeline Syntax 來幫我們產生 Publish over ssh 的 snippet。(路徑: Pipeline Syntax->Snippet Generator->sshPublisher)

![](https://i.imgur.com/5MRyal1.png)


![](https://i.imgur.com/lZosSY9.png)

* Source files: 要從 WorkSpace 取出的檔案，用 /**/* 才能夠取出所有資料夾底下的檔案
* Remove prefix: 這邊打 build 就只會傳送 build 底下的所有檔案，不然預設會連同 build 整個資料夾傳送過去
* Remote directory: Source files 會先放入這個資料夾才會傳送過去，並且會出現在之前設定的 remote directory 中
* Exec command: 最後要執行的指令，這邊執行的指令就是把 build 複製進去 Prod Server 中的專案資料夾，並且 pull 最新的 code 來重新 install 跟 restart。

完成後就可以先去 Prod Server 先把 Repo pull 下來並且利用 pm2 啟動，接下來再從 Github 上隨便改一個 dummy data，然後手動觸發 Jenkins Build，成功的話 Prod API Server 就可以直接讀到新的資料。

![](https://i.imgur.com/vWi9AAe.png)
(成功執行的 Pipeline 流程圖)

![](https://i.imgur.com/G1hcmJa.png)
(最新的 WorkSpace 可以看到所有檔案都在裡面了)

## Set up Github Hook

接下來只剩下 Push Github 自動觸發這塊我們就能夠完成簡單的 CI/CD 了。首先要去 Github 的 Developer Settings 產生一組 Personal access token，並且能夠讀取 repo 以及 發送 repo_hook。

![](https://i.imgur.com/8zCzNYp.png)

有了 token 後就可以回到 Jenkins 來處理 Github 存取的設定問題，首先是 Configure System 這邊要新增一個 Github Server，Credentials 的部分就填入之前產生的 API token 即可，一樣填完設定就可以 Test connection。

![](https://i.imgur.com/LUoeosN.png)

接下來是回到 Pipeline task 設定 Github repo 以及 設定 Webhook trigger build，都設定完 Jenkins 的部分就 OK 了。

![](https://i.imgur.com/MZ8zkXB.png)

最後我們回到 Github repo 中的 Settings 來把 Webhooks 設定好就大功告成了。
Payload URL 的部分就填寫 Jenkin Server 的位址。

![](https://i.imgur.com/hLD3Jy0.png)

Github Webhook 設定底下也會有最近的幾次 Deliveries，可以判斷有沒有成功發送。

![](https://i.imgur.com/nq8l84H.png)

## Test all process

一樣我們隨便改一個 dummy data 的欄位，並且 Commit & Push，接下來就可以盯著 Jenkins 自動跳出 Build 後自動跑完 CI/CD，我們只需要一直對 Prod API 做刷新的動作就可以看到新的資料囉 :smile: 

![](https://i.imgur.com/XAWJWog.png)
(Github 觸發的會在 Console output 第一行看到 **Started by GitHub push by ...**)

![](https://i.imgur.com/ozNaNMU.png)
(Changes 也會顯示此次 Commit 的內容以及不同的檔案)

## Demo

1. 從 Github Pull 專案下來: https://github.com/UnderSam/EasyExpressWithChai
2. 隨便改動 dummy data
3. Commit & Push master
4. 連到 140.115.54.44:5487/ 看資料是不是已經改動了

## Reference

[1] http://jenkins.readbook.tw/jenkins/workshop/lab101.html
[2] https://medium.com/@asciidev/testing-a-node-express-application-with-mocha-chai-9592d41c0083
[3] https://www.slideshare.net/dplayerd/jenkins-nodejs
[4] https://medium.com/@mosheezderman/how-to-set-up-ci-cd-pipeline-for-a-node-js-app-with-jenkins-c51581cc783c
[5] https://ithelp.ithome.com.tw/articles/10219083
[6] https://medium.com/@Bear_/%E4%BB%80%E9%BA%BC%E6%98%AF-ci-cd-72bd5ae571f1
[7] https://xenby.com/b/220-%E6%95%99%E5%AD%B8-%E7%94%A2%E7%94%9Fssh-key%E4%B8%A6%E4%B8%94%E9%80%8F%E9%81%8Ekey%E9%80%B2%E8%A1%8C%E5%85%8D%E5%AF%86%E7%A2%BC%E7%99%BB%E5%85%A5
