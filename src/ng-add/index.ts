import { Rule, SchematicContext, Tree, chain, noop, mergeWith, apply, url, template, move } from "@angular-devkit/schematics";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function ngAdd(options: MsalSchematicOption): Rule {
  return chain([
    options && options.skipPackageJson ? noop() : addPackageJsonDependency(),
    updateAppRouting(options),

    mergeWith(apply(url("./files"), [template({}), move(options.appDir)]))
  ]);
}

// install dependency to package.json and install
function addPackageJsonDependency() {
  return (_host: Tree, _context: SchematicContext) => {
    if (_host.exists("package.json")) {
      const jsonStr = _host.read("package.json")!.toString("utf-8");
      const json = JSON.parse(jsonStr);

      const type = "dependencies";
      if (!json[type]) {
        json[type] = {};
      }

      const globalPkg = "@tchitos/angular-predictive-preload";
      const version = "latest";
      if (!json[type][globalPkg]) {
        json[type][globalPkg] = version;
      }
      _context.logger.log("info", "@tchitos/angular-predictive-preload was added as dependency");

      _host.overwrite("package.json", JSON.stringify(json, null, 2));

      _context.addTask(new NodePackageInstallTask());
    }
    return _host;
  };
}

export function updateAppRouting(options: MsalSchematicOption) {
  return (_host: Tree, _context: SchematicContext) => {
    const indexPath = options.appDir + "app-routing.module.ts";

    if (_host.exists(indexPath)) {
      const content: Buffer | null = _host.read(indexPath);
      let strContent: string = "";
      if (content) strContent = content.toString();

      const updatedContent = addPreloadStrategy(strContent.toString(), _context);

      _host.overwrite(indexPath, updatedContent);
    } else {
      _context.logger.log("error", "Missing File with path => " + indexPath);
    }

    return _host;
  };
}

function addPreloadStrategy(str: string, _context: SchematicContext): string {
  if (str.indexOf("preloadingStrategy") == -1) {
    str = "import { PredictivePreloadingStrategy } from './app.preloadStrategy';\n" + str;
    if (str.indexOf("RouterModule.forRoot(routes,{") > -1) {
      return str.replace("RouterModule.forRoot(routes,{", "RouterModule.forRoot(routes,{ preloadingStrategy: PredictivePreloadingStrategy,");
    } else if (str.indexOf("RouterModule.forRoot(routes, {") > -1) {
      return str.replace("RouterModule.forRoot(routes, {", "RouterModule.forRoot(routes, { preloadingStrategy: PredictivePreloadingStrategy,");
    } else if (str.indexOf("RouterModule.forRoot(routes)") > -1) {
      return str.replace("RouterModule.forRoot(routes", "RouterModule.forRoot(routes, { preloadingStrategy: PredictivePreloadingStrategy}");
    }
  } else if (str.indexOf("preloadingStrategy: PreloadAllModules") > -1) {
    str = "import { PredictivePreloadingStrategy } from './app.preloadStrategy';\n" + str;
    return str.replace("preloadingStrategy: PreloadAllModules", "preloadingStrategy: PredictivePreloadingStrategy");
  } else if (str.indexOf("preloadingStrategy:PreloadAllModules") > -1) {
    str = "import { PredictivePreloadingStrategy } from './app.preloadStrategy';\n" + str;
    return str.replace("preloadingStrategy:PreloadAllModules", "preloadingStrategy:PredictivePreloadingStrategy");
  }
  return str;
}

export interface MsalSchematicOption {
  appDir: string;
  [key: string]: any;
}
