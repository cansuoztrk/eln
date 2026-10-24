# Tek imaj, üç rol: web (next start), worker (zamanlayıcı + görev kuyruğu), migrate (şema + temel veri).
# Gizli değerler imaja gömülmez; çalışma zamanında ortam değişkeni olarak verilir.
# Docker Hub hız sınırında: --build-arg NODE_IMAGE=mirror.gcr.io/library/node:22.22-bookworm-slim
ARG NODE_IMAGE=node:22.22-bookworm-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
# Derleme sırasında veritabanı gerekmez (prisma generate ve next build bağlanmaz; site haritası
# bu durumda yalnızca statik sayfaları içerir ve çalışma zamanında saatlik yenilenir).
# Bu adres yalnızca yapılandırma dosyalarının yüklenebilmesi içindir; çalışma zamanında ezilir.
ENV NEXT_TELEMETRY_DISABLED=1 DATABASE_URL="postgresql://build:build@127.0.0.1:1/build"
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# Kurumsal/TLS denetimli proxy arkasında derleme için isteğe bağlı CA paketi:
#   docker build --secret id=ca,src=/yol/ca-bundle.crt .
RUN --mount=type=secret,id=ca,required=false \
    if [ -f /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
    npm ci --no-audit --no-fund

FROM deps AS build
COPY . .
# Worker (tsx) ve göç (prisma CLI) aynı imajda çalıştığı için geliştirme bağımlılıkları korunur.
RUN --mount=type=secret,id=ca,required=false \
    if [ -f /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi; \
    npx prisma generate && npm run build

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN groupadd --system app && useradd --system --gid app --home /app app
COPY --from=build --chown=app:app /app/package.json /app/package-lock.json /app/prisma.config.ts /app/tsconfig.json /app/next.config.ts ./
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/.next ./.next
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/src ./src
COPY --from=build --chown=app:app /app/scripts ./scripts
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npx", "next", "start"]
