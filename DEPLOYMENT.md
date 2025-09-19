# Plaza Web 2.0 部署指南

本文档详细说明如何在新服务器上部署 Plaza Web 2.0 项目。

## 环境要求

- Node.js 16+ 
- npm 或 yarn
- Nginx
- 服务器系统：Ubuntu/CentOS/Debian

## 部署步骤

### 1. 服务器环境准备

#### 1.1 安装 Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

#### 1.2 安装 Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install epel-release
sudo yum install nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. 项目构建

#### 2.1 上传项目代码
```bash
# 在服务器上创建项目目录
sudo mkdir -p /var/www/plaza-web
sudo chown $USER:$USER /var/www/plaza-web

# 上传代码（使用 scp、git clone 或其他方式）
# 方式1：使用 git
cd /var/www/plaza-web
git clone <your-repository-url> .

# 方式2：使用 scp 上传本地代码
# scp -r ./plaza-web2.0/* user@server:/var/www/plaza-web/
```

#### 2.2 安装依赖并构建
```bash
cd /var/www/plaza-web

# 安装依赖
npm install

# 构建生产版本
npm run build
```

### 3. Nginx 配置

#### 3.1 创建 Nginx 配置文件
```bash
sudo nano /etc/nginx/sites-available/plaza-web
```

#### 3.2 配置内容
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或服务器IP
    
    root /var/www/plaza-web/dist;
    index index.html;
    
    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # 处理 Vue Router 的 history 模式
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 代理（如果需要）
    location /api/ {
        proxy_pass http://live.aiolos.com:8700/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

#### 3.3 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/plaza-web /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 4. SSL 证书配置（可选但推荐）

#### 4.1 使用 Let's Encrypt 免费证书
```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx  # Ubuntu/Debian
# 或
sudo yum install certbot python3-certbot-nginx  # CentOS

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 5. 防火墙配置

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 6. 部署脚本（可选）

创建自动化部署脚本 `deploy.sh`：

```bash
#!/bin/bash

echo "开始部署 Plaza Web 2.0..."

# 进入项目目录
cd /var/www/plaza-web

# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 构建项目
npm run build

# 重启 Nginx
sudo systemctl reload nginx

echo "部署完成！"
```

使用方式：
```bash
chmod +x deploy.sh
./deploy.sh
```

## 常见问题

### 1. 权限问题
```bash
# 确保 Nginx 有权限访问文件
sudo chown -R www-data:www-data /var/www/plaza-web/dist
sudo chmod -R 755 /var/www/plaza-web/dist
```

### 2. 端口被占用
```bash
# 检查端口占用
sudo netstat -tlnp | grep :80

# 停止占用端口的服务
sudo systemctl stop apache2  # 如果安装了 Apache
```

### 3. 构建失败
```bash
# 清理缓存重新构建
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 4. 查看日志
```bash
# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log
```

## 性能优化建议

1. **启用 HTTP/2**：在 SSL 配置中添加 `http2`
2. **配置 CDN**：将静态资源托管到 CDN
3. **数据库优化**：如果有后端 API，优化数据库查询
4. **监控设置**：使用 PM2、Supervisor 等工具监控应用状态

## 维护命令

```bash
# 查看 Nginx 状态
sudo systemctl status nginx

# 重启 Nginx
sudo systemctl restart nginx

# 查看磁盘使用情况
df -h

# 查看内存使用情况
free -h

# 查看系统负载
top
```

部署完成后，通过浏览器访问你的域名或服务器IP即可看到项目运行效果。