import * as path from 'path';
import { RequireFile, RequireFileWithDefault, RequireModule, RequireModuleWithDefault, RequireWithDefault } from '../src';
import ModuleClazz from './lib/module';
import * as uuid from 'uuid';
describe('Require unit test', () => {
  const dirname = path.resolve(__dirname, './lib/');
  test('RequireFile without cwd', () => {
    const target = RequireFile(path.resolve(dirname,'module.ts'));
    expect(target).toEqual({"b": 2, "c": 3, "default": ModuleClazz});
    const z = RequireFile('test/lib/module.ts');
    expect(z).toEqual({"b": 2, "c": 3, "default": ModuleClazz});
  })

  test('RequireFile within cwd', () => {
    const target = RequireFile('module.ts', dirname);
    expect(target).toEqual({"b": 2, "c": 3, "default": ModuleClazz});
  })

  test('RequireFileWithDefault', () => {
    const target = RequireFileWithDefault('module.ts', dirname);
    expect(target).toEqual(ModuleClazz);
  })

  test('RequireModule', () => {
    const target = RequireModule('uuid');
    expect(target).toEqual(uuid.v4);
  })

  test('RequireModuleWithDefault', () => {
    const target = RequireModuleWithDefault('uuid');
    expect(target).toEqual(undefined);
  })

  test('RequireWithDefault', () => {
    const a = RequireWithDefault('uuid');
    expect(a).toEqual(undefined);
    const b = RequireWithDefault(path.resolve(dirname,'module.ts'));
    expect(b).toEqual(ModuleClazz);
    try{ RequireWithDefault('lib/test') }catch(e){}
    try{ RequireWithDefault('lib/test/abc/ddd/dd') }catch(e){}
  })
})