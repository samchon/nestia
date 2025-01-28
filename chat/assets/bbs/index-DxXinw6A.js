import{S as U,Q as F,j as a,r as g,M as k,F as D,B as A,G as w,J as M,K as B,L as T,D as O,N as E,O as K,_ as C}from"../NestiaChatApplication-BT-CkVXt.js";import{D as L,_ as v,a as I}from"../_isFormatUuid-BCCU8n_q.js";class q{constructor(){this.articles=[]}create(o){const s={id:U(),title:o.input.title,body:o.input.body,thumbnail:o.input.thumbnail,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};return this.articles.push(s),s}update(o){const s=this.articles.find(m=>m.id===o.id);if(s===void 0)throw new Error("Unable to find the matched article.");o.input.title!==void 0&&(s.title=o.input.title),o.input.body!==void 0&&(s.body=o.input.body),o.input.thumbnail!==void 0&&(s.thumbnail=o.input.thumbnail),s.updated_at=new Date().toISOString()}erase(o){const s=this.articles.findIndex(m=>m.id===o.id);if(s===-1)throw new Error("Unable to find the matched article.");this.articles.splice(s,1)}}function $(){const[p,o]=g.useState(""),[s,m]=g.useState("gpt-4o-mini"),[b,S]=g.useState(window.navigator.language),[x,_]=g.useState(null),R=()=>{const h=new q,j=new E({provider:{type:"chatgpt",api:new K({apiKey:p,dangerouslyAllowBrowser:!0}),model:"gpt-4o-mini"},controllers:[{protocol:"class",name:"bbs",application:{model:"chatgpt",options:{reference:!1,strict:!1,separate:null},functions:[{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:`Information of the article to create.

------------------------------

Description of the current {@link IBbsArticle.ICreate} type:

> Information of the article to create.

------------------------------

Description of the parent {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,type:"object",properties:{title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:["title","body","thumbnail"]}},required:["input"],additionalProperties:!1,$defs:{}},output:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{title:"Primary Key",description:`Primary Key.


@format uuid`,type:"string"},created_at:{title:"Creation time of the article",description:`Creation time of the article.


@format date-time`,type:"string"},updated_at:{title:"Last updated time of the article",description:`Last updated time of the article.


@format date-time`,type:"string"},title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:["id","created_at","updated_at","title","body","thumbnail"]},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const c=e=>typeof e.input=="object"&&e.input!==null&&f(e.input),f=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&v(e.thumbnail)),y=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||n(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&u(e.input,t+".input",i)||n(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(l=>l),u=(e,t,i=!0)=>[typeof e.title=="string"||n(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||n(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(v(e.thumbnail)||n(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||n(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(l=>l),d=e=>typeof e=="object"&&e!==null&&c(e);let r,n;return e=>{if(d(e)===!1){r=[],n=C(r),((i,l,P=!0)=>(typeof i=="object"&&i!==null||n(!0,{path:l+"",expected:"__type",value:i}))&&y(i,l+"",!0)||n(!0,{path:l+"",expected:"__type",value:i}))(e,"$input",!0);const t=r.length===0;return t?{success:t,data:e}:{success:t,errors:r,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:`Target article's {@link IBbsArticle.id}.


@format uuid`,type:"string"},input:{description:`Make all properties in T optional

------------------------------

Description of the current {@link PartialIBbsArticle.ICreate} type:

> Make all properties in T optional`,type:"object",properties:{title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:[]}},required:["id","input"],additionalProperties:!1,$defs:{}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const c=e=>typeof e.id=="string"&&I(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&f(e.input),f=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&v(e.thumbnail)),y=(e,t,i=!0)=>[typeof e.id=="string"&&(I(e.id)||n(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||n(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||n(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&u(e.input,t+".input",i)||n(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(l=>l),u=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||n(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||n(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(v(e.thumbnail)||n(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||n(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(l=>l),d=e=>typeof e=="object"&&e!==null&&c(e);let r,n;return e=>{if(d(e)===!1){r=[],n=C(r),((i,l,P=!0)=>(typeof i=="object"&&i!==null||n(!0,{path:l+"",expected:"__type",value:i}))&&y(i,l+"",!0)||n(!0,{path:l+"",expected:"__type",value:i}))(e,"$input",!0);const t=r.length===0;return t?{success:t,data:e}:{success:t,errors:r,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:`Target article's {@link IBbsArticle.id}.


@format uuid`,type:"string"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const c=r=>typeof r.id=="string"&&I(r.id),f=(r,n,e=!0)=>[typeof r.id=="string"&&(I(r.id)||d(e,{path:n+".id",expected:'string & Format<"uuid">',value:r.id}))||d(e,{path:n+".id",expected:'(string & Format<"uuid">)',value:r.id})].every(t=>t),y=r=>typeof r=="object"&&r!==null&&c(r);let u,d;return r=>{if(y(r)===!1){u=[],d=C(u),((e,t,i=!0)=>(typeof e=="object"&&e!==null||d(!0,{path:t+"",expected:"__type",value:e}))&&f(e,t+"",!0)||d(!0,{path:t+"",expected:"__type",value:e}))(r,"$input",!0);const n=u.length===0;return n?{success:n,data:r}:{success:n,errors:u,data:r}}return{success:!0,data:r}}})()}]},execute:async c=>h[c.function.name](c.arguments)}],config:{locale:b}});_(j)};return a.jsx("div",{style:{width:"100%",height:"100%",overflow:x?void 0:"auto"},children:x?a.jsx(k,{agent:x}):a.jsxs(D,{style:{width:"calc(100% - 60px)",padding:15,margin:15},children:[a.jsx(A,{variant:"h6",children:"BBS A.I. Chatbot"}),a.jsx("br",{}),a.jsx(L,{}),a.jsx("br",{}),"Demonstration of Nestia A.I. Chatbot with TypeScript Controller Class.",a.jsx("br",{}),a.jsx("br",{}),a.jsx(A,{variant:"h6",children:" OpenAI Configuration "}),a.jsx(w,{onChange:h=>o(h.target.value),defaultValue:p,label:"OpenAI API Key",variant:"outlined",placeholder:"Your OpenAI API Key",error:p.length===0}),a.jsx("br",{}),a.jsxs(M,{defaultValue:s,onChange:(h,j)=>m(j),style:{paddingLeft:15},children:[a.jsx(B,{control:a.jsx(T,{}),label:"GPT-4o Mini",value:"gpt-4o-mini"}),a.jsx(B,{control:a.jsx(T,{}),label:"GPT-4o",value:"gpt-4o"})]}),a.jsx("br",{}),a.jsx(A,{variant:"h6",children:" Membership Information "}),a.jsx("br",{}),a.jsx(w,{onChange:h=>S(h.target.value),defaultValue:b,label:"Locale",variant:"outlined",error:b.length===0}),a.jsx("br",{}),a.jsx("br",{}),a.jsx(O,{component:"a",fullWidth:!0,variant:"contained",color:"info",size:"large",disabled:p.length===0||b.length===0,onClick:()=>R(),children:"Start A.I. Chatbot"})]})})}const G=async()=>{F(window.document.getElementById("root")).render(a.jsx($,{}))};G().catch(console.error);
