---
alwaysApply: false
globs: *.ts,*.tsx
---
1. You should never use the "any" type in TypeScript, if that ever happens you need to refactor the code
2. You should always either create a new model inside the models folder inside the target module or use an existing model from the current module or shared module.
