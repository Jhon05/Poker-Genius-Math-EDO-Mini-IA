(()=>{'use strict';const G=window.GeniusMath;let local=null,cloud=null,current=null;
G.ModelProvider={current(){return current||(current=local||(local=new G.LocalModelProvider()));},local(){return local||(local=new G.LocalModelProvider());},
 async activateLocal(profile){const p=this.local();if(current&&current!==p)current.cancel?.();current=p;await p.initialize(profile);return p;},
 async activateCloud(consent){cloud=cloud||new G.CloudModelProvider(G.config.cloud);await cloud.initialize({consent});current=cloud;return cloud;},
 useGuided(){this.current().cancel?.();current=G.GuidedProvider;return current;},
 set(p){if(!p||typeof p.complete!=='function')throw Error('Proveedor inválido.');current=p;},cancel(){this.current().cancel?.();}};
})();
