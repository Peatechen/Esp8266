var wifi = require("Wifi");
var http = require("http");
var mqtt = require("tinyMQTT").create("xxx");
// 温度传感器
//let ow = new OneWire(NodeMCU.D2);
//let sensor = require("DS18B20").connect(ow);
let Interval_1 = null;
let Interval_2 = null;
let Interval_3 = null;

// 连接热点函数
function connectTo(Ap,Passwd){
  wifi.connect(Ap, {password: Passwd},
   function(err){if(err)console.log(err);else{
  }
  });
}

// 解析接入点和密码
function handlePOST(req) {
  let data = "";
  req.on('data', function(d) { data += d; });
  req.on('end', function() {
    postData = {};
    data.split("&").forEach(function(el) {
      let els = el.split("=");
      postData[els[0]] = decodeURIComponent(els[1]);
    });
    connectTo(postData.name,postData.passwd);
  });
}


// 发送页面
function pageRequest(req, res) {
  var a = url.parse(req.url, true);
  switch (a.pathname){
    case "/": 
      // 定义页面
      let page =`
 <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><title>配置</title><style>        html,body{            margin: 0;            padding: 0;        }        body{            background-color: rgb(40,44,52);        }        form{            height: auto;            margin: 0 auto;            text-align: center;            box-sizing: border-box;            padding: 2rem;        }        label{            font-size: 1.5rem;            color:white;            min-width: 4em;            text-align: left;        }        input[type="text"]{            font-size: 1.5rem;            border: none;            border-radius: 0.5rem;            width: 8em;        }        input[type="submit"]{            font-size: 1.2rem;            border: none;            border-radius: 0.4rem;            padding: 0.3rem 1rem;        }        .v-flex{            display: flex;            justify-content:start;            margin: 5rem 0;            flex-wrap: nowrap;        }</style></head><body><h1 style="font-size:3rem;text-align:center;color:white">连接WIFI</h1><div style="display: flex;justify-content:center"><form action="http://192.168.4.1/connect" method="post"><div class="v-flex"><label for="name">接入点：</label><input type="text" id="name" value="" class="name" name="name"></div><div class="v-flex"><label for="passwd">密码：</label><input type="text" id="passwd" value="" class="passwd" name="passwd"></div><input type="submit" value="连接"></form></div></body></html>`;
      res.writeHead(200,{'Content-Type': 'text/html;charset=UTF-8'});
      res.end(page);
      break;
    case "/connect":
       if (req.method=="POST" &&
        req.headers["Content-Type"]=="application/x-www-form-urlencoded"){
          handlePOST(req);
       }
       res.end("ok");
       break;
    default:
      res.end("404");
      break;
  } 
};

function onInit(){
  wifi.on('connected',()=>{
    // 成功连接路由器
    console.log("connected!");
    mqtt.connect();
    wifi.save();
  });

  wifi.on("disconnected",()=>{
    clearInterval(Interval_1);
  });

  // 开启一个 AP
  wifi.startAP('Esp8266AP', { password: 'peatechen', authMode: 'wpa2' }, function(err) {
    if (err) throw err;
      console.log("AP OK");
      // 建立服务
      var server = http.createServer(pageRequest);
      server.listen(80);
      // mqtt 连接上后
      mqtt.on("connected", function(){
          let temperature;
          let humidity;
          clearInterval(Interval_1);
          Interval_1=setInterval(function() {
            //sensor.getTemp(function (temp) {
            //  temperature = temp;
            //});
            humidity = analogRead(A0)
            let msg = {
              Humidity: humidity,
              Temperature: temperature
            };
            mqtt.publish("h",JSON.stringify(msg), { qos: 0, retain: true });
            if(humidity>0.7){
              digitalWrite(NodeMCU.D0,0);
              mqtt.publish("a","1",{qos:0,retain:true});
              clearInterval(Interval_3);
              Interval_3=setInterval(function() {
                if(analogRead(A0)<0.45){
                  digitalWrite(NodeMCU.D0,1);
                  clearInterval(Interval_3);
                }
              },3000);
            }
          }, 1800000);
          mqtt.subscribe("3",{qos:1}); // 开泵
          mqtt.subscribe("4",{qos:1}); // 关泵
      });

      mqtt.on("disconnected", function(){
        console.log("disconnected");
        clearInterval(Interval_1);
        mqtt.connect();
      });

      // 监听消息
      mqtt.on("message", function(msg){
        switch(msg.topic){
          case "3":{
            digitalWrite(NodeMCU.D0,0);
            mqtt.publish("a","1",{qos:0,retain:true});
            clearInterval(Interval_2);
            Interval_2=setInterval(function() {
              if(analogRead(A0)<0.45){
                digitalWrite(NodeMCU.D0,1);
                clearInterval(Interval_2);
              }
          }, 3000);
            break;
          };
          case "4":{
            digitalWrite(NodeMCU.D0,1);
            clearInterval(Interval_2);
            break;
          }
          default:break;
        };
      });
  }); 
}

save();


