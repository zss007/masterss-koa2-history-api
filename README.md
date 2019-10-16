# masterss-koa2-history-api
在 HTML5 单页应用使用 History API 时，用来代理请求到特定的 index 页面（参照 https://github.com/bripkens/connect-history-api-fallback ，添加白名单属性）。

## 内容目录

- [介绍](#介绍)
- [使用](#使用)
- [选项](#选项)
	- [index](#index)
	- [rewrites](#rewrites)
    - [whiteList](#whiteList)
	- [verbose](#verbose)
	- [htmlAcceptHeaders](#htmlacceptheaders)
	- [disableDotRule](#disabledotrule)

## 介绍

单页应用 SPA 通常都只使用一个 index 文件，一般情况下文件名为 `index.html`。页面导航则使用 [HTML5 History API](https://developer.mozilla.org/zh-CN/docs/Web/API/History)。然后有个问题就是如果用户刷新或者直接输入特定的链接而不是从 index 页面加载进去，比如 `/help` 或 `/help/online`，这个时候就会绕过 index 页面导致无法返回相应页面而出现 *404 - Not Found* 给用户。这个中间件就是用来处理这种情况的，它会改变请求地址到特定的 index 地址（默认是 `index.html`）。这里是符合条件会被处理的情况：

1. 是 GET request
2. 接收 `text/html`
3. 不是直接的文件请求，比如请求路径不包含 `.` 字符
4. 没有匹配到选项中的 rewrites

## 使用

中间件能够很方便的使用 NPM 进行安装

```
<!-- 使用npm私有仓库 -->
npm install --save masterss-koa2-history-api --registry=http://npm.master-ss.cn/
```

引入库

```javascript
var history = require('masterss-koa2-history-api');
```

在 koa2 中使用

```javascript
const Koa = require('koa');
const historyApi = require('masterss-koa2-history-api');
const app = new Koa();

app.use(historyApi({ ... }));
```

## 选项

### index
可以重写 index（默认是 `/index.html`）

```javascript
history({
  index: '/default.html'
});
```

### rewrites
当请求匹配到正则后，重新定位到其他页面而不是 index，可以使用字符串或函数。

下面这个例子就会重新定位匹配 `/\/soccer/` 的请求地址到 `/soccer.html`。
```javascript
history({
  rewrites: [
    { from: /\/soccer/, to: '/soccer.html'}
  ]
});
```

函数可以被用来做更多的自定义，比如下面将会重新定位 `/libs/jquery/jquery.1.12.0.min.js` 请求到 `./bower_components/libs/jquery/jquery.1.12.0.min.js`。
```javascript
history({
  rewrites: [
    {
      from: /^\/libs\/.*$/,
      to: function(context) {
        return '/bower_components' + context.parsedUrl.pathname;
      }
    }
  ]
});
```

函数参数 context 对象包含以下属性：

 - **parsedUrl**: 使用 `url.parse` 解析当前 url 后获取到的对象
 - **match**: 使用 `String.match(...)` 匹配的结果
 - **request**: HTTP 请求对象


### whiteList
原作者的插件默认会将所有的请求都指向到 index，这样可能就会导致项目内其他路由也被指向到 index，所以在原作者的使用方法下增加了白名单选项。比如下面的例子中，如果 `new RegExp('/api')` 匹配到了当前路由，则不做任何处理。

```javascript
history({
  whiteList: ['/api']
});
```

### verbose
这个中间件默认不打印任何信息，但是如果你想激活打印功能，可以通过设置 `verbose` 选项或者直接传递一个日志打印函数。

```javascript
history({
  verbose: true
});
```

或者使用你自己的日志打印函数

```javascript
history({
  logger: console.log.bind(console)
});
```

### htmlAcceptHeaders
覆盖默认 `Accepts:` 头（默认是 `['text/html', '*/*']`）

```javascript
history({
  htmlAcceptHeaders: ['text/html', 'application/xhtml+xml']
})
```

### disableDotRule
不允许上面提到的 `.`：

```javascript
history({
  disableDotRule: true
})
```
