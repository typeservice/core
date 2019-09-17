import * as path from 'path';

type EsModuleType<T = any> = {
  __esModule: true,
  default: T,
  [name: string]: any,
}

export function RequireFile<T = any>(pather: string, cwd?: string) {
  const moduleExports = path.isAbsolute(pather) 
    ? require(pather) 
    : require(path.resolve(cwd || process.cwd(), pather));
  return moduleExports as T;
}

export function RequireFileWithDefault<T = any>(pather: string, cwd?: string) {
  const moduleExports = RequireFile<EsModuleType<T>>(pather, cwd);
  return moduleExports.default;
}

export function RequireModule<T = any>(packagename: string) {
  return <T>require(packagename);
}

export function RequireModuleWithDefault<T = any>(packagename: string) {
  const moduleExports = RequireModule<EsModuleType<T>>(packagename);
  return moduleExports.default;
}

export function RequireWithDefault<T = any>(pather: string) {
  if (!isModule(pather)) return RequireFileWithDefault<T>(pather);
  return RequireModuleWithDefault<T>(pather);
}

function isModule(pather: string) {
  if (path.isAbsolute(pather)) return false;
  const sp = pather.split('/');
  switch (sp.length) {
    case 1:
    case 2:
      try{
        require.resolve(pather);
        return true;
      }catch(e) {
        return false;
      }
    default: return false;
  }
}