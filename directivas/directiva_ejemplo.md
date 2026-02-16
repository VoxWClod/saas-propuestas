# Directiva de Ejemplo para SaaS Propuestas

## Objetivo
Esta es una directiva de plantilla. Define objetivos, entradas, salidas y pasos lógicos para cada tarea automatizada.

## Inputs (Entradas)
- Parámetro 1: Descripción del input
- Parámetro 2: Origen de datos (API, archivo, base de datos)

## Outputs (Salidas)
- Archivo generado en `.tmp/` o destino final
- Formato esperado (JSON, CSV, Google Doc, etc.)

## Pasos de Ejecución
1. Validar credenciales y parámetros de entrada
2. Ejecutar lógica principal
3. Procesar y transformar datos
4. Guardar resultados
5. Log de resultados y errores

## Restricciones y Casos Borde
> **IMPORTANTE:** Esta sección es CRÍTICA. Documenta aquí todas las limitaciones descubiertas durante la ejecución.

- **Restricción 1:** Descripción de la limitación
- **Error Conocido:** Qué causa el error y cómo evitarlo
- **Límite de API:** Tasas, cuotas, regiones soportadas

## Notas
- Esta directiva debe actualizarse cada vez que se descubre un nuevo comportamiento
- Los scripts en `scripts/` deben seguir esta directiva estrictamente
