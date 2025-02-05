import{j as a,o as C,r as y,T as g}from"../client-DXtQ0KPe.js";import{v as T,N as A,O as w,_ as v,f as R,F as S,T as I,R as _,d as x,e as j,B as P,q as U}from"../NestiaChatApplication-DBvWx3OX.js";import{a as f,_ as b}from"../_isFormatUri-C0kZuYaC.js";import{D as k}from"../Divider-CUbRy4c5.js";class F{constructor(){this.articles=[]}index(){return this.articles}create(o){const l={id:T(),title:o.input.title,body:o.input.body,thumbnail:o.input.thumbnail,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};return this.articles.push(l),l}update(o){const l=this.articles.find(s=>s.id===o.id);if(l===void 0)throw new Error("Unable to find the matched article.");o.input.title!==void 0&&(l.title=o.input.title),o.input.body!==void 0&&(l.body=o.input.body),o.input.thumbnail!==void 0&&(l.thumbnail=o.input.thumbnail),l.updated_at=new Date().toISOString()}erase(o){const l=this.articles.findIndex(s=>s.id===o.id);if(l===-1)throw new Error("Unable to find the matched article.");this.articles.splice(l,1)}}const D=u=>{const o=new F,l=new A({provider:{type:"chatgpt",api:new w({apiKey:u.apiKey,dangerouslyAllowBrowser:!0}),model:u.model??"gpt-4o-mini"},controllers:[{protocol:"class",name:"bbs",application:{model:"chatgpt",options:{reference:!1,strict:!1,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{}},output:{description:"List of every articles",type:"array",items:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{title:"Primary Key",description:`Primary Key.


@format uuid`,type:"string"},created_at:{title:"Creation time of the article",description:`Creation time of the article.


@format date-time`,type:"string"},updated_at:{title:"Last updated time of the article",description:`Last updated time of the article.


@format date-time`,type:"string"},title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:s=>({success:!0,data:s})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:`Information of the article to create.

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

Writes a new article and archives it into the DB.`,validate:(()=>{const s=e=>typeof e.input=="object"&&e.input!==null&&p(e.input),p=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&f(e.thumbnail)),h=(e,t,n=!0)=>[(typeof e.input=="object"&&e.input!==null||r(n,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&m(e.input,t+".input",n)||r(n,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(d=>d),m=(e,t,n=!0)=>[typeof e.title=="string"||r(n,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(n,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(f(e.thumbnail)||r(n,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(n,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(d=>d),c=e=>typeof e=="object"&&e!==null&&s(e);let i,r;return e=>{if(c(e)===!1){i=[],r=v(i),((n,d,B=!0)=>(typeof n=="object"&&n!==null||r(!0,{path:d+"",expected:"__type",value:n}))&&h(n,d+"",!0)||r(!0,{path:d+"",expected:"__type",value:n}))(e,"$input",!0);const t=i.length===0;return t?{success:t,data:e}:{success:t,errors:i,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:`Target article's {@link IBbsArticle.id}.


@format uuid`,type:"string"},input:{description:`Make all properties in T optional

------------------------------

Description of the current {@link PartialIBbsArticle.ICreate} type:

> Make all properties in T optional`,type:"object",properties:{title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:[]}},required:["id","input"],additionalProperties:!1,$defs:{}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const s=e=>typeof e.id=="string"&&b(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&p(e.input),p=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&f(e.thumbnail)),h=(e,t,n=!0)=>[typeof e.id=="string"&&(b(e.id)||r(n,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(n,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(n,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&m(e.input,t+".input",n)||r(n,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(d=>d),m=(e,t,n=!0)=>[e.title===void 0||typeof e.title=="string"||r(n,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(n,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(f(e.thumbnail)||r(n,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(n,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(d=>d),c=e=>typeof e=="object"&&e!==null&&s(e);let i,r;return e=>{if(c(e)===!1){i=[],r=v(i),((n,d,B=!0)=>(typeof n=="object"&&n!==null||r(!0,{path:d+"",expected:"__type",value:n}))&&h(n,d+"",!0)||r(!0,{path:d+"",expected:"__type",value:n}))(e,"$input",!0);const t=i.length===0;return t?{success:t,data:e}:{success:t,errors:i,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:`Target article's {@link IBbsArticle.id}.


@format uuid`,type:"string"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const s=i=>typeof i.id=="string"&&b(i.id),p=(i,r,e=!0)=>[typeof i.id=="string"&&(b(i.id)||c(e,{path:r+".id",expected:'string & Format<"uuid">',value:i.id}))||c(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:i.id})].every(t=>t),h=i=>typeof i=="object"&&i!==null&&s(i);let m,c;return i=>{if(h(i)===!1){m=[],c=v(m),((e,t,n=!0)=>(typeof e=="object"&&e!==null||c(!0,{path:t+"",expected:"__type",value:e}))&&p(e,t+"",!0)||c(!0,{path:t+"",expected:"__type",value:e}))(i,"$input",!0);const r=m.length===0;return r?{success:r,data:i}:{success:r,errors:m,data:i}}return{success:!0,data:i}}})()}]},execute:async s=>o[s.function.name](s.arguments)}],config:{locale:u.locale,timezone:u.timezone}});return a.jsx(R,{agent:l})};function O(){const[u,o]=y.useState(""),[l,s]=y.useState("gpt-4o-mini"),[p,h]=y.useState(window.navigator.language),[m,c]=y.useState(!1);return a.jsx("div",{style:{width:"100%",height:"100%",overflow:U?void 0:"auto"},children:m===!0?a.jsx(D,{apiKey:u,model:l,locale:p}):a.jsxs(S,{style:{width:"calc(100% - 60px)",padding:15,margin:15},children:[a.jsx(g,{variant:"h6",children:"BBS A.I. Chatbot"}),a.jsx("br",{}),a.jsx(k,{}),a.jsx("br",{}),"Demonstration of Nestia A.I. Chatbot with TypeScript Controller Class.",a.jsx("br",{}),a.jsx("br",{}),a.jsx(g,{variant:"h6",children:" OpenAI Configuration "}),a.jsx(I,{onChange:i=>o(i.target.value),defaultValue:u,label:"OpenAI API Key",variant:"outlined",placeholder:"Your OpenAI API Key",error:u.length===0}),a.jsx("br",{}),a.jsxs(_,{defaultValue:l,onChange:(i,r)=>s(r),style:{paddingLeft:15},children:[a.jsx(x,{control:a.jsx(j,{}),label:"GPT-4o Mini",value:"gpt-4o-mini"}),a.jsx(x,{control:a.jsx(j,{}),label:"GPT-4o",value:"gpt-4o"})]}),a.jsx("br",{}),a.jsx(g,{variant:"h6",children:" Membership Information "}),a.jsx("br",{}),a.jsx(I,{onChange:i=>h(i.target.value),defaultValue:p,label:"Locale",variant:"outlined",error:p.length===0}),a.jsx("br",{}),a.jsx("br",{}),a.jsx(P,{component:"a",fullWidth:!0,variant:"contained",color:"info",size:"large",disabled:u.length===0||p.length===0,onClick:()=>c(!0),children:"Start A.I. Chatbot"})]})})}C(window.document.getElementById("root")).render(a.jsx(O,{}));
