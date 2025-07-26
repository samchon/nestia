import{j as y,o as U,r as v,T as I}from"../client-B3aq8qpT.js";import{q as k,t as $,r as B,s as F,w as M,x as S,y as q,z as D,E as L,J as C,K as T,M as O,N as E,v as x,d as K,_ as m,V as j,c as N,F as G,T as W,B as z}from"../VendorConfigurationMovie-ObEJbk8r.js";import{a as u,_ as p}from"../_isFormatUri-YqTfGpHo.js";import{D as H}from"../Divider-DX1xhf0M.js";class A{constructor(o){this.props=o,this.operations_=k.compose({controllers:o.controllers,config:o.config}),this.histories_=(o.histories??[]).map(d=>$({operations:this.operations_.group,history:d})),this.token_usage_=this.props.tokenUsage!==void 0?this.props.tokenUsage instanceof B?this.props.tokenUsage:new B(this.props.tokenUsage):B.zero(),this.listeners_=new Map,this.semaphore_=o.vendor.semaphore!=null?typeof o.vendor.semaphore=="object"?o.vendor.semaphore:new F(o.vendor.semaphore):null}clone(){var o;return new A({...this.props,histories:(o=this.props.histories)==null?void 0:o.slice()})}async conversate(o){var t,i,n,h;const d=[],s=f=>{this.dispatch(f).catch(()=>{}),"toHistory"in f&&("join"in f?d.push(async()=>(await f.join(),f.toHistory())):d.push(async()=>f.toHistory()))},l=M({contents:Array.isArray(o)?o:typeof o=="string"?[{type:"text",text:o}]:[o]});s(l);const a=this.getContext({prompt:l,dispatch:s,usage:this.token_usage_}),r=await S(a,this.operations_.array);r.length&&((i=(t=this.props.config)==null?void 0:t.executor)==null?void 0:i.describe)!==null&&((h=(n=this.props.config)==null?void 0:n.executor)==null?void 0:h.describe)!==!1&&await q(a,r);const e=await Promise.all(d.map(async f=>f()));return this.histories_.push(...e),e}getConfig(){return this.props.config}getVendor(){return this.props.vendor}getOperations(){return this.operations_.array}getControllers(){return this.props.controllers}getHistories(){return this.histories_}getTokenUsage(){return this.token_usage_}getContext(o){const d=async(s,l)=>{var w;const a=L({source:s,body:{...l,model:this.props.vendor.model,stream:!0,stream_options:{include_usage:!0}},options:this.props.vendor.options});o.dispatch(a);const r=((w=this.props.config)==null?void 0:w.backoffStrategy)??(b=>{throw b.error}),e=await(async()=>{let b=0;for(;;)try{return await this.props.vendor.api.chat.completions.create(a.body,a.options)}catch(g){const R=r({count:b,error:g});await new Promise(P=>setTimeout(P,R)),b++}})(),[t,i]=C.transform(e.toReadableStream(),b=>T.transformCompletionChunk(b)).tee(),[n,h]=i.tee();(async()=>{const b=n.getReader();for(;;){const g=await b.read();if(g.done)break;g.value.usage!=null&&O.aggregate({kind:s,completionUsage:g.value.usage,usage:o.usage})}})().catch(()=>{});const[f,_]=t.tee();return o.dispatch({id:x(),type:"response",source:s,stream:E(f.getReader()),body:a.body,options:a.options,join:async()=>{const b=await C.readAll(_);return T.merge(b)},created_at:new Date().toISOString()}),h};return{operations:this.operations_,config:this.props.config,histories:this.histories_,prompt:o.prompt,dispatch:o.dispatch,request:this.semaphore_===null?d:async(s,l)=>{await this.semaphore_.acquire();try{return await d(s,l)}finally{this.semaphore_.release().catch(()=>{})}}}}on(o,d){return D(this.listeners_,o,()=>new Set).add(d),this}off(o,d){const s=this.listeners_.get(o);return s!==void 0&&(s.delete(d),s.size===0&&this.listeners_.delete(o)),this}async dispatch(o){const d=this.listeners_.get(o.type);d!==void 0&&await Promise.all(Array.from(d).map(async s=>{try{await s(o)}catch{}}))}}class V{constructor(){this.articles=[]}index(){return this.articles}create(o){const d={id:x(),title:o.input.title,body:o.input.body,thumbnail:o.input.thumbnail,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};return this.articles.push(d),d}update(o){const d=this.articles.find(s=>s.id===o.id);if(d===void 0)throw new Error("Unable to find the matched article.");o.input.title!==void 0&&(d.title=o.input.title),o.input.body!==void 0&&(d.body=o.input.body),o.input.thumbnail!==void 0&&(d.thumbnail=o.input.thumbnail),d.updated_at=new Date().toISOString()}erase(o){const d=this.articles.findIndex(s=>s.id===o.id);if(d===-1)throw new Error("Unable to find the matched article.");this.articles.splice(d,1)}}const J={chatgpt:{model:"chatgpt",options:{reference:!0,strict:!1,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:`Primary Key.


@format uuid`,type:"string"},created_at:{description:`Creation time of the article.


@format date-time`,type:"string"},updated_at:{description:`Last updated time of the article.


@format date-time`,type:"string"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"List of every articles",type:"array",items:{$ref:"#/$defs/IBbsArticle"}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:c=>({success:!0,data:c})},{name:"create",parameters:{description:` Properties of create function

### Description of {@link input} property:

> Information of the article to create`,type:"object",properties:{input:{$ref:"#/$defs/IBbsArticle.ICreate"}},required:["input"],additionalProperties:!1,$defs:{"IBbsArticle.ICreate":{description:"Information of the article to create.",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:["title","body","thumbnail"]},IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:`Primary Key.


@format uuid`,type:"string"},created_at:{description:`Creation time of the article.


@format date-time`,type:"string"},updated_at:{description:`Last updated time of the article.


@format date-time`,type:"string"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"Newly created article",$ref:"#/$defs/IBbsArticle"},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const c=e=>typeof e.input=="object"&&e.input!==null&&o(e.input),o=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:` Properties of update function

### Description of {@link input} property:

> New content to update.`,type:"object",properties:{id:{description:`Target article's {@link IBbsArticle.id}.


@format uuid`,type:"string"},input:{$ref:"#/$defs/PartialIBbsArticle.ICreate"}},required:["id","input"],additionalProperties:!1,$defs:{"PartialIBbsArticle.ICreate":{description:"Make all properties in T optional",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:[]}}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const c=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&o(e.input),o=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{description:`Target article's {@link IBbsArticle.id}.


@format uuid`,type:"string"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const c=a=>typeof a.id=="string"&&p(a.id),o=(a,r,e=!0)=>[typeof a.id=="string"&&(p(a.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:a.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:a.id})].every(t=>t),d=a=>typeof a=="object"&&a!==null&&c(a);let s,l;return a=>{if(d(a)===!1){s=[],l=m(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&o(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(a,"$input",!0);const r=s.length===0;return r?{success:r,data:a}:{success:r,errors:s,data:a}}return{success:!0,data:a}}})()}]},claude:{model:"claude",options:{reference:!0,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"List of every articles",type:"array",items:{$ref:"#/$defs/IBbsArticle"}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:c=>({success:!0,data:c})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:"Information of the article to create",$ref:"#/$defs/IBbsArticle.ICreate"}},required:["input"],additionalProperties:!1,$defs:{"IBbsArticle.ICreate":{description:"Information of the article to create.",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["title","body","thumbnail"]},IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"Newly created article",$ref:"#/$defs/IBbsArticle"},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const c=e=>typeof e.input=="object"&&e.input!==null&&o(e.input),o=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"},input:{description:"New content to update.",$ref:"#/$defs/PartialIBbsArticle.ICreate"}},required:["id","input"],additionalProperties:!1,$defs:{"PartialIBbsArticle.ICreate":{description:"Make all properties in T optional",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:[]}}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const c=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&o(e.input),o=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const c=a=>typeof a.id=="string"&&p(a.id),o=(a,r,e=!0)=>[typeof a.id=="string"&&(p(a.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:a.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:a.id})].every(t=>t),d=a=>typeof a=="object"&&a!==null&&c(a);let s,l;return a=>{if(d(a)===!1){s=[],l=m(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&o(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(a,"$input",!0);const r=s.length===0;return r?{success:r,data:a}:{success:r,errors:s,data:a}}return{success:!0,data:a}}})()}]},deepseek:{model:"deepseek",options:{reference:!0,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"List of every articles",type:"array",items:{$ref:"#/$defs/IBbsArticle"}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:c=>({success:!0,data:c})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:"Information of the article to create",$ref:"#/$defs/IBbsArticle.ICreate"}},required:["input"],additionalProperties:!1,$defs:{"IBbsArticle.ICreate":{description:"Information of the article to create.",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["title","body","thumbnail"]},IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"Newly created article",$ref:"#/$defs/IBbsArticle"},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const c=e=>typeof e.input=="object"&&e.input!==null&&o(e.input),o=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"},input:{description:"New content to update.",$ref:"#/$defs/PartialIBbsArticle.ICreate"}},required:["id","input"],additionalProperties:!1,$defs:{"PartialIBbsArticle.ICreate":{description:"Make all properties in T optional",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:[]}}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const c=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&o(e.input),o=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const c=a=>typeof a.id=="string"&&p(a.id),o=(a,r,e=!0)=>[typeof a.id=="string"&&(p(a.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:a.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:a.id})].every(t=>t),d=a=>typeof a=="object"&&a!==null&&c(a);let s,l;return a=>{if(d(a)===!1){s=[],l=m(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&o(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(a,"$input",!0);const r=s.length===0;return r?{success:r,data:a}:{success:r,errors:s,data:a}}return{success:!0,data:a}}})()}]},gemini:{model:"gemini",options:{recursive:3,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},required:[]},output:{type:"array",items:{type:"object",properties:{id:{type:"string",description:`Primary Key.


@format uuid`},created_at:{type:"string",description:`Creation time of the article.


@format date-time`},updated_at:{type:"string",description:`Last updated time of the article.


@format date-time`},title:{type:"string",description:`Title of the article.

Representative title of the article.`},body:{type:"string",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",nullable:!0,description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.


@format uri
@contentMediaType image/*`}},required:["id","created_at","updated_at","title","body","thumbnail"],description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`},description:"List of every articles"},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:c=>({success:!0,data:c})},{name:"create",parameters:{type:"object",properties:{input:{type:"object",properties:{title:{type:"string",description:`Title of the article.

Representative title of the article.`},body:{type:"string",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",nullable:!0,description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.


@format uri
@contentMediaType image/*`}},required:["title","body","thumbnail"],description:`Information of the article to create

------------------------------

Description of the current {@link IBbsArticle.ICreate} type:

> Information of the article to create.

------------------------------

Description of the parent {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`}},required:["input"],description:" Properties of create function"},output:{type:"object",properties:{id:{type:"string",description:`Primary Key.


@format uuid`},created_at:{type:"string",description:`Creation time of the article.


@format date-time`},updated_at:{type:"string",description:`Last updated time of the article.


@format date-time`},title:{type:"string",description:`Title of the article.

Representative title of the article.`},body:{type:"string",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",nullable:!0,description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.


@format uri
@contentMediaType image/*`}},required:["id","created_at","updated_at","title","body","thumbnail"],description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const c=e=>typeof e.input=="object"&&e.input!==null&&o(e.input),o=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{type:"object",properties:{id:{type:"string",description:`Target article's {@link IBbsArticle.id}.


@format uuid`},input:{type:"object",properties:{title:{type:"string",description:`Title of the article.

Representative title of the article.`},body:{type:"string",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",nullable:!0,description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.


@format uri
@contentMediaType image/*`}},required:[],description:`New content to update.

------------------------------

Description of the current {@link PartialIBbsArticle.ICreate} type:

> Make all properties in T optional`}},required:["id","input"],description:" Properties of update function"},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const c=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&o(e.input),o=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{type:"object",properties:{id:{type:"string",description:`Target article's {@link IBbsArticle.id}.


@format uuid`}},required:["id"],description:" Properties of erase function"},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const c=a=>typeof a.id=="string"&&p(a.id),o=(a,r,e=!0)=>[typeof a.id=="string"&&(p(a.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:a.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:a.id})].every(t=>t),d=a=>typeof a=="object"&&a!==null&&c(a);let s,l;return a=>{if(d(a)===!1){s=[],l=m(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&o(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(a,"$input",!0);const r=s.length===0;return r?{success:r,data:a}:{success:r,errors:s,data:a}}return{success:!0,data:a}}})()}]},llama:{model:"llama",options:{reference:!0,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"List of every articles",type:"array",items:{$ref:"#/$defs/IBbsArticle"}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:c=>({success:!0,data:c})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:"Information of the article to create",$ref:"#/$defs/IBbsArticle.ICreate"}},required:["input"],additionalProperties:!1,$defs:{"IBbsArticle.ICreate":{description:"Information of the article to create.",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["title","body","thumbnail"]},IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"Newly created article",$ref:"#/$defs/IBbsArticle"},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const c=e=>typeof e.input=="object"&&e.input!==null&&o(e.input),o=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"},input:{description:"New content to update.",$ref:"#/$defs/PartialIBbsArticle.ICreate"}},required:["id","input"],additionalProperties:!1,$defs:{"PartialIBbsArticle.ICreate":{description:"Make all properties in T optional",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:[]}}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const c=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&o(e.input),o=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const c=a=>typeof a.id=="string"&&p(a.id),o=(a,r,e=!0)=>[typeof a.id=="string"&&(p(a.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:a.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:a.id})].every(t=>t),d=a=>typeof a=="object"&&a!==null&&c(a);let s,l;return a=>{if(d(a)===!1){s=[],l=m(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&o(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(a,"$input",!0);const r=s.length===0;return r?{success:r,data:a}:{success:r,errors:s,data:a}}return{success:!0,data:a}}})()}]},"3.0":{model:"3.0",options:{recursive:3,constraint:!0,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[]},output:{type:"array",items:{type:"object",properties:{id:{type:"string",format:"uuid",description:"Primary Key."},created_at:{type:"string",format:"date-time",description:"Creation time of the article."},updated_at:{type:"string",format:"date-time",description:"Last updated time of the article."},title:{type:"string",description:`Title of the article.

Representative title of the article.`},body:{type:"string",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",format:"uri",contentMediaType:"image/*",nullable:!0,description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`}},required:["id","created_at","updated_at","title","body","thumbnail"],description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,additionalProperties:!1},description:"List of every articles"},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:c=>({success:!0,data:c})},{name:"create",parameters:{type:"object",properties:{input:{type:"object",properties:{title:{type:"string",description:`Title of the article.

Representative title of the article.`},body:{type:"string",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",format:"uri",contentMediaType:"image/*",nullable:!0,description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`}},required:["title","body","thumbnail"],description:`Information of the article to create

------------------------------

Description of the current {@link IBbsArticle.ICreate} type:

> Information of the article to create.

------------------------------

Description of the parent {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,additionalProperties:!1}},required:["input"],description:" Properties of create function",additionalProperties:!1},output:{type:"object",properties:{id:{type:"string",format:"uuid",description:"Primary Key."},created_at:{type:"string",format:"date-time",description:"Creation time of the article."},updated_at:{type:"string",format:"date-time",description:"Last updated time of the article."},title:{type:"string",description:`Title of the article.

Representative title of the article.`},body:{type:"string",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",format:"uri",contentMediaType:"image/*",nullable:!0,description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`}},required:["id","created_at","updated_at","title","body","thumbnail"],description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,additionalProperties:!1},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const c=e=>typeof e.input=="object"&&e.input!==null&&o(e.input),o=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{type:"object",properties:{id:{type:"string",format:"uuid",description:"Target article's {@link IBbsArticle.id}."},input:{type:"object",properties:{title:{type:"string",description:`Title of the article.

Representative title of the article.`},body:{type:"string",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",format:"uri",contentMediaType:"image/*",nullable:!0,description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`}},required:[],description:`New content to update.

------------------------------

Description of the current {@link PartialIBbsArticle.ICreate} type:

> Make all properties in T optional`,additionalProperties:!1}},required:["id","input"],description:" Properties of update function",additionalProperties:!1},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const c=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&o(e.input),o=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{type:"object",properties:{id:{type:"string",format:"uuid",description:"Target article's {@link IBbsArticle.id}."}},required:["id"],description:" Properties of erase function",additionalProperties:!1},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const c=a=>typeof a.id=="string"&&p(a.id),o=(a,r,e=!0)=>[typeof a.id=="string"&&(p(a.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:a.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:a.id})].every(t=>t),d=a=>typeof a=="object"&&a!==null&&c(a);let s,l;return a=>{if(d(a)===!1){s=[],l=m(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&o(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(a,"$input",!0);const r=s.length===0;return r?{success:r,data:a}:{success:r,errors:s,data:a}}return{success:!0,data:a}}})()}]},"3.1":{model:"3.1",options:{reference:!0,constraint:!0,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"List of every articles",type:"array",items:{$ref:"#/$defs/IBbsArticle"}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:c=>({success:!0,data:c})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:"Information of the article to create",$ref:"#/$defs/IBbsArticle.ICreate"}},required:["input"],additionalProperties:!1,$defs:{"IBbsArticle.ICreate":{description:"Information of the article to create.",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["title","body","thumbnail"]},IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"Newly created article",$ref:"#/$defs/IBbsArticle"},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const c=e=>typeof e.input=="object"&&e.input!==null&&o(e.input),o=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"},input:{description:"New content to update.",$ref:"#/$defs/PartialIBbsArticle.ICreate"}},required:["id","input"],additionalProperties:!1,$defs:{"PartialIBbsArticle.ICreate":{description:"Make all properties in T optional",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:[]}}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const c=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&o(e.input),o=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(n=>n),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(n=>n),l=e=>typeof e=="object"&&e!==null&&c(e);let a,r;return e=>{if(l(e)===!1){a=[],r=m(a),((i,n,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:n+"",expected:"__type",value:i}))&&d(i,n+"",!0)||r(!0,{path:n+"",expected:"__type",value:i}))(e,"$input",!0);const t=a.length===0;return t?{success:t,data:e}:{success:t,errors:a,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const c=a=>typeof a.id=="string"&&p(a.id),o=(a,r,e=!0)=>[typeof a.id=="string"&&(p(a.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:a.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:a.id})].every(t=>t),d=a=>typeof a=="object"&&a!==null&&c(a);let s,l;return a=>{if(d(a)===!1){s=[],l=m(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&o(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(a,"$input",!0);const r=s.length===0;return r?{success:r,data:a}:{success:r,errors:s,data:a}}return{success:!0,data:a}}})()}]}};function Q(c){const o=new V,d=new A({model:"chatgpt",vendor:{api:c.api,model:c.vendorModel},controllers:[{protocol:"class",name:"bbs",application:J[c.schemaModel],execute:o}],config:{locale:c.locale,timezone:c.timezone}});return y.jsx(K,{agent:d})}function X(){const[c,o]=v.useState(j.defaultConfig()),[d,s]=v.useState(window.navigator.language),[l,a]=v.useState(!1);return y.jsx("div",{style:{width:"100%",height:"100%",overflow:l===!0?void 0:"auto"},children:l===!0?y.jsx(Q,{api:new N({apiKey:c.apiKey,baseURL:c.baseURL,dangerouslyAllowBrowser:!0}),vendorModel:c.vendorModel,schemaModel:c.schemaModel,locale:d}):y.jsxs(G,{style:{width:"calc(100% - 60px)",padding:15,margin:15},children:[y.jsx(I,{variant:"h6",children:"BBS AI Chatbot"}),y.jsx("br",{}),y.jsx(H,{}),y.jsx("br",{}),"Demonstration of Agentica with TypeScript Controller Class.",y.jsx("br",{}),y.jsx("br",{}),y.jsx(I,{variant:"h6",children:" OpenAI Configuration "}),y.jsx("br",{}),y.jsx(j,{config:c,onChange:o}),y.jsx("br",{}),y.jsx(I,{variant:"h6",children:" Membership Information "}),y.jsx("br",{}),y.jsx(W,{onChange:r=>s(r.target.value),defaultValue:d,label:"Locale",variant:"outlined",error:d.length===0}),y.jsx("br",{}),y.jsx("br",{}),y.jsx(z,{component:"a",fullWidth:!0,variant:"contained",color:"info",size:"large",disabled:c.apiKey.length===0||c.vendorModel.length===0||c.schemaModel.length===0||d.length===0,onClick:()=>a(!0),children:"Start AI Chatbot"})]})})}U(window.document.getElementById("root")).render(y.jsx(X,{}));
