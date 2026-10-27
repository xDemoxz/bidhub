# 06 · Empaquetado

**Qué es:** Dockerfile multi-etapa (deps, build, runner) con `output: standalone`.

**Cómo funciona:** la imagen final solo lleva lo necesario y corre sin root. Las migraciones se aplican aparte.

**Nota:** no se pudo construir la imagen en el entorno de desarrollo (sin daemon de Docker); verifícala en tu máquina.
