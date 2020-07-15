# NodeMcu 模块接入点及自身热点设置
### 说明：本次 NodeMcu 刷入的固件是 Espruino,该固件采用 javascript 进行编码。编写一个 web 页面设置 Esp8266 的接入点。该代码主要配合作者使用微信小程序对其进行远程控制。

- 复制源码到Espruino Web IDE中
- 使用串口连接WiFi模块和电脑，点击 Espruino Web IDE 页面左上角黄色图标进行连接
- 点击写入按钮

### 此段代码能够实现 NodeMcu 模块断电重起后自动重连，另外还在 NodeMcu 上运行 mqtt 客户端。手机连接好 NodeMcu 提供的 Wifi 热点（“ESP8266AP”）后，浏览器访问 “http://192.168.4.1” ，填写表单提交后进行入网。

@[linxianxi](https://github.com/linxianxi)
