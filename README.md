# 部署
确保运行环境中有`docker`和`docker compose`，并且联网以及能访问`docker hub`
1. 构建docker images
`docker compose build`
2. 创建容器并启动服务
`docker compose up -d`

端口占用
- 前端: `8888`
- 后端: `8080`
- 数据库: `3307`