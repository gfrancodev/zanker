import fs from 'node:fs';
import path from 'node:path';
import {parseCommandLineOptions, resolveWithin} from '../src/common.mjs';
import {inspectProject} from '../src/inspect.mjs';
import {startStudio} from '../src/studio.mjs';
import {prepareSandbox,runSandbox} from '../src/sandbox.mjs';
import {auditURL,captureAccessibilityOutline} from '../src/audit.mjs';
import {diagnoseElement} from '../src/forensics.mjs';
import {documentVisual} from '../src/documents.mjs';
import {validateAll} from '../src/validation.mjs';
import {buildAdapters} from '../src/adapters.mjs';
import {searchIcons} from '../src/icons.mjs';
import {createSVG,generateMotionCSS,optimizeImage} from '../src/media.mjs';
import {recordDecision,listDecisions} from '../src/decisions.mjs';
import {runDesignSearch} from '../src/design-search.mjs';
import {searchReferenceSites} from '../src/reference-sites.mjs';
import {searchComponents} from '../src/component-catalog.mjs';
import {loadMotionCatalog, searchMotionTechniques} from '../src/motion-catalog.mjs';
const [action,...args]=process.argv.slice(2);
const o=parseCommandLineOptions(args);const project=path.resolve(String(o.project||process.cwd()));
const print=(x)=>console.log(JSON.stringify(x,null,2));
async function main(){
 switch(action){
 case 'inspect':return print(inspectProject(project));
 case 'studio':{const s=await startStudio({project,concepts:o.concepts,port:Number(o.port||0)});print({url:s.url,events:s.log});return;}
 case 'studio-events':{
   const base=resolveWithin(project,'.zanker/studio');
   if(!fs.existsSync(base))return print({events:[],total:0,source:null});
   const candidates=fs.readdirSync(base).filter(n=>/^events-[a-zA-Z0-9_.-]+\.jsonl$/.test(n)).sort();
   const selected=o.file?String(o.file):candidates.at(-1);
   if(!selected||!candidates.includes(selected))return print({events:[],total:0,source:null});
   const file=resolveWithin(base,selected),raw=fs.readFileSync(file,'utf8');
   if(raw.length>1024*1024)throw Error('Studio event log exceeds 1 MB; archive old sessions');
   const entries=raw.split('\n').filter(Boolean).map(line=>JSON.parse(line));
   const offset=Number(o.since||0);
   if(!Number.isSafeInteger(offset)||offset<0)throw Error('--since must be a nonnegative integer');
   return print({events:entries.slice(offset,offset+100),total:entries.length,next:Math.min(offset+100,entries.length),source:selected});
 }
 case 'sandbox-prepare':{if(!o.entry)throw Error('--entry required');return print(prepareSandbox({project,entry:o.entry,exportName:o.export||'default',styles:o.styles||'',wrapper:o.wrapper||'',scenarios:o.scenarios||'',id:o.id||'',framework:o.framework||'auto'}));}
 case 'sandbox-run':{if(!o.id)throw Error('--id required');const p=resolveWithin(project,path.join('.zanker','sandboxes',String(o.id),'sandbox.meta.json'));const meta=JSON.parse(fs.readFileSync(p,'utf8'));if(meta.project!==project)throw Error('Sandbox belongs to different project');const s=await runSandbox(meta,{port:Number(o.port||5174),allowExecution:o['allow-execution']===true});return print({url:s.url,notes:s.notes||'Isolated HTML preview'});}
 case 'audit':{if(!o.url)throw Error('--url required');const a=await auditURL({project,url:o.url,viewports:o.viewports,output:o.out,allowRemote:o['allow-remote']===true,axe:o.axe===true,schemes:o.schemes,motion:o.motion});return print(a);}
 case 'diagnose':{if(!o.url||!o.selector)throw Error('--url and --selector required');return print(await diagnoseElement({project,url:o.url,selector:o.selector,allowRemote:o['allow-remote']===true}));}
 case 'document':return print(documentVisual({project,title:o.title||'Visual documentation',description:o.description||'',source:o.source||'',visualspec:o.visualspec||'',screenshots:o.screenshots?String(o.screenshots).split(','):[],status:o.status||'implemented'}).metadata);
 case 'icons':return print(searchIcons(String(o.query||'')));
 case 'media-svg':return print({file:createSVG({project,out:o.out||'zanker-art.svg',title:o.title||'Decorative illustration',kind:o.kind||'empty',accent:o.accent||'#5b73eb'})});
 case 'media-optimize':return print({file:await optimizeImage({project,input:o.input,output:o.output,format:o.format||'webp',width:Number(o.width||1400)})});
 case 'motion-css':return print({file:generateMotionCSS({project,out:o.out||'zanker.motion.css'})});
 case 'decisions':return print(o.title?recordDecision({project,title:o.title,decision:o.decision||'',status:o.status||'proposed',approvedBy:o['approved-by']||'',evidence:o.evidence?String(o.evidence).split(','):[]}):listDecisions(project));
 case 'build-adapters':{const r=buildAdapters({out:o.out,check:o.check===true});print(r);if(o.check===true&&!r.inSync)process.exitCode=1;return;}
 case 'validate':{const v=validateAll();print(v);if(!v.ok)process.exitCode=1;return;}
 case 'design-search':return print(runDesignSearch({project, options:o}));
 case 'reference-search':return print({ok:true, results:searchReferenceSites(String(o.query||''))});
 case 'component-search':return print({ok:true, results:searchComponents(String(o.query||''))});
 case 'motion-search':{
   const catalog=loadMotionCatalog();
   return print({
     ok:true,
     results:searchMotionTechniques(String(o.query||'')),
     directionContract:catalog.directionContract,
     designMeter:catalog.designMeter,
     attribution:catalog.attribution,
   });
 }
 case 'a11y-outline':{if(!o.url)throw Error('--url required');return print(await captureAccessibilityOutline({url:o.url,allowRemote:o['allow-remote']===true}));}
 default:throw Error('Unsupported script action; run one of the named .sh or .ps1 scripts.');
 }
}
main().catch(e=>{console.error('Zanker script:',e.message||String(e));process.exitCode=1});
