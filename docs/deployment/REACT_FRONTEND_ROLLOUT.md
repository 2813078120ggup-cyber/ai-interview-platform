# React 前端发布手册（test 分支）

本手册只更新前端容器，不会删除 MySQL、Redis 数据卷，也不会重建后端。

## 1. 本机打包 test 分支

在 Windows PowerShell 执行：

```powershell
cd D:\AAAAAAAtyut\ai-interview-platform-test
git archive --format=tar.gz --output D:\AAAAAAAtyut\ai-interview-platform-test-react.tar.gz test
scp D:\AAAAAAAtyut\ai-interview-platform-test-react.tar.gz admin@47.93.204.227:/tmp/
```

如果使用 root 登录，将最后一行的 `admin` 替换为 `root`。

## 2. 服务器备份并覆盖源码

```bash
sudo -i
cd /opt
tar -czf ai-interview-platform-before-react-$(date +%F-%H%M).tar.gz ai-interview-platform
rm -rf /opt/ai-interview-platform-next
mkdir -p /opt/ai-interview-platform-next
tar -xzf /tmp/ai-interview-platform-test-react.tar.gz -C /opt/ai-interview-platform-next
```

保留现有 `.env`，不要从压缩包覆盖生产密钥：

```bash
cp /opt/ai-interview-platform/.env /opt/ai-interview-platform-next/.env
chown -R admin:admin /opt/ai-interview-platform-next
mv /opt/ai-interview-platform /opt/ai-interview-platform-vue-backup
mv /opt/ai-interview-platform-next /opt/ai-interview-platform
```

## 3. 仅重建 React 前端

```bash
su - admin
cd /opt/ai-interview-platform
sudo docker compose config --quiet
sudo docker compose build frontend
sudo docker compose up -d --no-deps frontend
sudo docker compose ps
sudo docker compose logs --tail=100 frontend
curl -I http://127.0.0.1/
```

`docker-compose.yml` 已指向 `./frontend-react`。该构建会使用 React 19、Vite、Tailwind 产物以及 Nginx 的 `/api/` 反向代理。

## 4. 发布验证

浏览器访问 `http://服务器公网IP/login`，验证：

1. 管理员登录后进入 `/admin/interviews`。
2. 候选人登录后进入 `/candidate/interviews`。
3. 创建面试、候选人进入面试间、结束后查看报告。

公网 HTTP 不能调用摄像头和麦克风。需要先配置域名和 HTTPS，才能验证这两项功能。

## 回退

若前端出现问题，保留的旧 Vue 源码位于 `/opt/ai-interview-platform-vue-backup`。停止服务后恢复目录，并将 `docker-compose.yml` 的前端构建上下文改回 `./frontend`，再执行：

```bash
sudo docker compose build frontend
sudo docker compose up -d --no-deps frontend
```
