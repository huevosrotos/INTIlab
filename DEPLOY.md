# ============================================================
# DrogLab — Guía de deployment en LXC (Proxmox)
# ============================================================

Esta guía te lleva desde un LXC vacío hasta DrogLab corriendo en
producción con Docker, accesible desde tu red local.

---
## 0. Requisitos previos en el LXC (Proxmox)

Docker necesita "nesting" habilitado en el LXC. En el HOST de Proxmox:

    pct set <CTID> --features nesting=1
    pct restart <CTID>

Reemplazá <CTID> por el ID de tu contenedor (ej: 101).

Para verificar que el nesting funciona, dentro del LXC:

    cat /proc/1/status | grep Cap | head -1
    # debe incluir "cap_setfcap"

---
## 1. Instalar Docker dentro del LXC

Entrá al LXC (por consola Proxmox o SSH) como root y ejecutá:

    # Debian/Ubuntu
    apt update
    apt install -y ca-certificates curl gnupg

    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | \
      gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Verificar
    docker --version
    docker compose version

---
## 2. Copiar el proyecto al LXC

### Opción A — Desde un repo Git (recomendado)

Si subiste el proyecto a un repo (GitHub, GitLab, Gitea local):

    apt install -y git
    cd /opt
    git clone https://tu-repo/droglab.git
    cd droglab

### Opción B — Subir un tarball desde tu máquina

Desde tu PC (donde tenés el código), creá un tarball:

    cd /home/z/my-project
    tar --exclude='node_modules' --exclude='.next' --exclude='db' \
        --exclude='uploads' --exclude='*.log' \
        -czf droglab.tar.gz .

Subilo al LXC por SCP:

    scp droglab.tar.gz root@<IP-DEL-LXC>:/opt/

Y dentro del LXC:

    mkdir -p /opt/droglab
    tar -xzf /opt/droglab.tar.gz -C /opt/droglab
    cd /opt/droglab

---
## 3. Levantar el servicio

    cd /opt/droglab
    docker compose up -d --build

La primera vez tarda 3-5 min (descarga imágenes, compila Next.js).

Verificá que esté corriendo:

    docker compose ps
    docker compose logs -f

Cuando veas ">> Iniciando servidor Next.js en puerto 3000…",
la app está lista.

---
## 4. Acceder desde la red local

Si el LXC tiene IP 192.168.1.50, abrí en el navegador:

    http://192.168.1.50:3000

Login: admin@lab.org  /  droglab123

⚠️ IMPORTANTE: cambiá estas contraseñas antes de usar en producción
(ver sección 6).

---
## 5. Datos persistentes

La base SQLite y las fotos de envases se guardan en:

    /opt/droglab/data/db/custom.db      # base de datos
    /opt/droglab/data/uploads/          # fotos subidas

Hacé backup periódico de esa carpeta:

    tar -czf droglab-backup-$(date +%F).tar.gz data/

---
## 6. Seguridad (antes de producción real)

### a) Cambiar contraseñas de los usuarios demo

Entrá a la app como admin y cambiá las contraseñas, o ejecutá
dentro del contenedor:

    docker compose exec droglab sh -c \
      'node -e "
        const {PrismaClient} = require(\"@prisma/client\");
        const crypto = require(\"crypto\");
        const p = new PrismaClient();
        const hash = crypto.createHash(\"sha256\").update(\"droglab_salt_2024_v1\" + \"TU_NUEVA_PASS\").digest(\"hex\");
        p.user.update({where:{email:\"admin@lab.org\"}, data:{password:hash}}).then(()=>{console.log(\"OK\"); process.exit(0)});
      "'

### b) Ponerlo detrás de un reverse proxy con HTTPS (Caddy/Nginx)

Para que el escáner QR funcione en el celu necesitás HTTPS.
Instalá Caddy en el LXC:

    apt install -y caddy

Editá /etc/caddy/Caddyfile:

    droglab.tudominio.com {
        reverse_proxy localhost:3000
    }

    systemctl restart caddy

Caddy gestiona certificados Let's Encrypt automáticamente.

### c) Firewall

Asegurate de abrir solo los puertos necesarios (80 y 443 para
Caddy; NO exponer el 3000 directamente si usás reverse proxy).

---
## 7. Comandos útiles

    docker compose up -d --build    # reconstruir tras actualizar código
    docker compose down             # detener
    docker compose restart          # reiniciar
    docker compose logs -f          # ver logs en vivo
    docker compose exec droglab sh  # entrar al contenedor

    # Resetear la base de datos (¡borra todo!)
    docker compose down
    rm -rf data/db/*
    docker compose up -d --build

---
## 8. Actualizar el código

    cd /opt/droglab
    git pull                         # o copiar nuevos archivos
    docker compose up -d --build
    # el volumen data/ se preserva, no perdés datos
