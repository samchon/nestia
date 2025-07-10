import{j as m,o as v,r as f,T as b}from"../client-B3aq8qpT.js";import{v as I,A as B,d as T,_ as y,V as g,c as C,F as A,T as j,B as w}from"../VendorConfigurationMovie-XswDxr8q.js";import{a as u,_ as p}from"../_isFormatUri-YqTfGpHo.js";import{D as x}from"../Divider-DX1xhf0M.js";class R{constructor(){this.articles=[]}index(){return this.articles}create(c){const d={id:I(),title:c.input.title,body:c.input.body,thumbnail:c.input.thumbnail,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};return this.articles.push(d),d}update(c){const d=this.articles.find(s=>s.id===c.id);if(d===void 0)throw new Error("Unable to find the matched article.");c.input.title!==void 0&&(d.title=c.input.title),c.input.body!==void 0&&(d.body=c.input.body),c.input.thumbnail!==void 0&&(d.thumbnail=c.input.thumbnail),d.updated_at=new Date().toISOString()}erase(c){const d=this.articles.findIndex(s=>s.id===c.id);if(d===-1)throw new Error("Unable to find the matched article.");this.articles.splice(d,1)}}const U={chatgpt:{model:"chatgpt",options:{reference:!1,strict:!1,separate:null},functions:[{name:"index",parameters:{description:"",type:"object",properties:{},additionalProperties:!1,required:[],$defs:{}},output:{description:"List of every articles",type:"array",items:{description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,type:"object",properties:{id:{title:"Primary Key",description:`Primary Key.


@format uuid`,type:"string"},created_at:{title:"Creation time of the article",description:`Creation time of the article.


@format date-time`,type:"string"},updated_at:{title:"Last updated time of the article",description:`Last updated time of the article.


@format date-time`,type:"string"},title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:o=>({success:!0,data:o})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:`Information of the article to create

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
@contentMediaType image/*`}]}},required:["title","body","thumbnail"]}},required:["input"],additionalProperties:!1,$defs:{}},output:{description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,type:"object",properties:{id:{title:"Primary Key",description:`Primary Key.


@format uuid`,type:"string"},created_at:{title:"Creation time of the article",description:`Creation time of the article.


@format date-time`,type:"string"},updated_at:{title:"Last updated time of the article",description:`Last updated time of the article.


@format date-time`,type:"string"},title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:["id","created_at","updated_at","title","body","thumbnail"]},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const o=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:`Target article's {@link IBbsArticle.id}.


@format uuid`,type:"string"},input:{description:`New content to update.

------------------------------

Description of the current {@link PartialIBbsArticle.ICreate} type:

> Make all properties in T optional`,type:"object",properties:{title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:[]}},required:["id","input"],additionalProperties:!1,$defs:{}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const o=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:`Target article's {@link IBbsArticle.id}.


@format uuid`,type:"string"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const o=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&o(n);let s,l;return n=>{if(d(n)===!1){s=[],l=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]},claude:{model:"claude",options:{reference:!1,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{}},output:{description:"List of every articles",type:"array",items:{description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,type:"object",properties:{id:{title:"Primary Key",description:"Primary Key.",type:"string",format:"uuid"},created_at:{title:"Creation time of the article",description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{title:"Last updated time of the article",description:"Last updated time of the article.",type:"string",format:"date-time"},title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:o=>({success:!0,data:o})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:`Information of the article to create

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

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["title","body","thumbnail"]}},required:["input"],additionalProperties:!1,$defs:{}},output:{description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,type:"object",properties:{id:{title:"Primary Key",description:"Primary Key.",type:"string",format:"uuid"},created_at:{title:"Creation time of the article",description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{title:"Last updated time of the article",description:"Last updated time of the article.",type:"string",format:"date-time"},title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const o=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"},input:{description:`New content to update.

------------------------------

Description of the current {@link PartialIBbsArticle.ICreate} type:

> Make all properties in T optional`,type:"object",properties:{title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:[]}},required:["id","input"],additionalProperties:!1,$defs:{}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const o=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const o=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&o(n);let s,l;return n=>{if(d(n)===!1){s=[],l=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]},gemini:{model:"gemini",options:{recursive:3,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},required:[]},output:{type:"array",items:{type:"object",properties:{id:{type:"string",description:`Primary Key.


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

List up every articles archived in the BBS DB.`,validate:o=>({success:!0,data:o})},{name:"create",parameters:{type:"object",properties:{input:{type:"object",properties:{title:{type:"string",description:`Title of the article.

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

Writes a new article and archives it into the DB.`,validate:(()=>{const o=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{type:"object",properties:{id:{type:"string",description:`Target article's {@link IBbsArticle.id}.


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

Updates an article with new content.`,validate:(()=>{const o=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{type:"object",properties:{id:{type:"string",description:`Target article's {@link IBbsArticle.id}.


@format uuid`}},required:["id"],description:" Properties of erase function"},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const o=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&o(n);let s,l;return n=>{if(d(n)===!1){s=[],l=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]},llama:{model:"llama",options:{reference:!1,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{}},output:{description:"List of every articles",type:"array",items:{description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,type:"object",properties:{id:{title:"Primary Key",description:"Primary Key.",type:"string",format:"uuid"},created_at:{title:"Creation time of the article",description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{title:"Last updated time of the article",description:"Last updated time of the article.",type:"string",format:"date-time"},title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:o=>({success:!0,data:o})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:`Information of the article to create

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

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["title","body","thumbnail"]}},required:["input"],additionalProperties:!1,$defs:{}},output:{description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,type:"object",properties:{id:{title:"Primary Key",description:"Primary Key.",type:"string",format:"uuid"},created_at:{title:"Creation time of the article",description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{title:"Last updated time of the article",description:"Last updated time of the article.",type:"string",format:"date-time"},title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const o=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"},input:{description:`New content to update.

------------------------------

Description of the current {@link PartialIBbsArticle.ICreate} type:

> Make all properties in T optional`,type:"object",properties:{title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:[]}},required:["id","input"],additionalProperties:!1,$defs:{}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const o=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const o=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&o(n);let s,l;return n=>{if(d(n)===!1){s=[],l=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]},"3.0":{model:"3.0",options:{constraint:!0,recursive:3,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[]},output:{type:"array",items:{type:"object",properties:{id:{type:"string",format:"uuid",title:"Primary Key",description:"Primary Key."},created_at:{type:"string",format:"date-time",title:"Creation time of the article",description:"Creation time of the article."},updated_at:{type:"string",format:"date-time",title:"Last updated time of the article",description:"Last updated time of the article."},title:{type:"string",title:"Title of the article",description:`Title of the article.

Representative title of the article.`},body:{type:"string",title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",format:"uri",contentMediaType:"image/*",nullable:!0,title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`}},required:["id","created_at","updated_at","title","body","thumbnail"],description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,additionalProperties:!1},description:"List of every articles"},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:o=>({success:!0,data:o})},{name:"create",parameters:{type:"object",properties:{input:{type:"object",properties:{title:{type:"string",title:"Title of the article",description:`Title of the article.

Representative title of the article.`},body:{type:"string",title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",format:"uri",contentMediaType:"image/*",nullable:!0,title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`}},required:["title","body","thumbnail"],description:`Information of the article to create

------------------------------

Description of the current {@link IBbsArticle.ICreate} type:

> Information of the article to create.

------------------------------

Description of the parent {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,additionalProperties:!1}},required:["input"],description:" Properties of create function",additionalProperties:!1},output:{type:"object",properties:{id:{type:"string",format:"uuid",title:"Primary Key",description:"Primary Key."},created_at:{type:"string",format:"date-time",title:"Creation time of the article",description:"Creation time of the article."},updated_at:{type:"string",format:"date-time",title:"Last updated time of the article",description:"Last updated time of the article."},title:{type:"string",title:"Title of the article",description:`Title of the article.

Representative title of the article.`},body:{type:"string",title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",format:"uri",contentMediaType:"image/*",nullable:!0,title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`}},required:["id","created_at","updated_at","title","body","thumbnail"],description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,additionalProperties:!1},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const o=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{type:"object",properties:{id:{type:"string",format:"uuid",title:"Target article's {@link IBbsArticle.id}",description:"Target article's {@link IBbsArticle.id}."},input:{type:"object",properties:{title:{type:"string",title:"Title of the article",description:`Title of the article.

Representative title of the article.`},body:{type:"string",title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",format:"uri",contentMediaType:"image/*",nullable:!0,title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`}},required:[],description:`New content to update.

------------------------------

Description of the current {@link PartialIBbsArticle.ICreate} type:

> Make all properties in T optional`,additionalProperties:!1}},required:["id","input"],description:" Properties of update function",additionalProperties:!1},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const o=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{type:"object",properties:{id:{type:"string",format:"uuid",title:"Target article's {@link IBbsArticle.id}",description:"Target article's {@link IBbsArticle.id}."}},required:["id"],description:" Properties of erase function",additionalProperties:!1},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const o=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&o(n);let s,l;return n=>{if(d(n)===!1){s=[],l=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]},"3.1":{model:"3.1",options:{constraint:!0,reference:!1,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{}},output:{description:"List of every articles",type:"array",items:{description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,type:"object",properties:{id:{title:"Primary Key",description:"Primary Key.",type:"string",format:"uuid"},created_at:{title:"Creation time of the article",description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{title:"Last updated time of the article",description:"Last updated time of the article.",type:"string",format:"date-time"},title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:o=>({success:!0,data:o})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:`Information of the article to create

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

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["title","body","thumbnail"]}},required:["input"],additionalProperties:!1,$defs:{}},output:{description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,type:"object",properties:{id:{title:"Primary Key",description:"Primary Key.",type:"string",format:"uuid"},created_at:{title:"Creation time of the article",description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{title:"Last updated time of the article",description:"Last updated time of the article.",type:"string",format:"date-time"},title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const o=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"},input:{description:`New content to update.

------------------------------

Description of the current {@link PartialIBbsArticle.ICreate} type:

> Make all properties in T optional`,type:"object",properties:{title:{title:"Title of the article",description:`Title of the article.

Representative title of the article.`,type:"string"},body:{title:"Content body",description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{title:"Thumbnail image URI",description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:[]}},required:["id","input"],additionalProperties:!1,$defs:{}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const o=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),l=e=>typeof e=="object"&&e!==null&&o(e);let n,r;return e=>{if(l(e)===!1){n=[],r=y(n),((i,a,h=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{title:"Target article's {@link IBbsArticle.id}",description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const o=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||l(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||l(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&o(n);let s,l;return n=>{if(d(n)===!1){s=[],l=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||l(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||l(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]}};function k(o){const c=new R,d=new B({model:"chatgpt",vendor:{api:o.api,model:o.vendorModel},controllers:[{protocol:"class",name:"bbs",application:U[o.schemaModel],execute:c}],config:{locale:o.locale,timezone:o.timezone,executor:{initialize:null}}});return m.jsx(T,{agent:d})}function P(){const[o,c]=f.useState(g.defaultConfig()),[d,s]=f.useState(window.navigator.language),[l,n]=f.useState(!1);return m.jsx("div",{style:{width:"100%",height:"100%",overflow:l===!0?void 0:"auto"},children:l===!0?m.jsx(k,{api:new C({apiKey:o.apiKey,baseURL:o.baseURL,dangerouslyAllowBrowser:!0}),vendorModel:o.vendorModel,schemaModel:o.schemaModel,locale:d}):m.jsxs(A,{style:{width:"calc(100% - 60px)",padding:15,margin:15},children:[m.jsx(b,{variant:"h6",children:"BBS AI Chatbot"}),m.jsx("br",{}),m.jsx(x,{}),m.jsx("br",{}),"Demonstration of Agentica with TypeScript Controller Class.",m.jsx("br",{}),m.jsx("br",{}),m.jsx(b,{variant:"h6",children:" OpenAI Configuration "}),m.jsx("br",{}),m.jsx(g,{config:o,onChange:c}),m.jsx("br",{}),m.jsx(b,{variant:"h6",children:" Membership Information "}),m.jsx("br",{}),m.jsx(j,{onChange:r=>s(r.target.value),defaultValue:d,label:"Locale",variant:"outlined",error:d.length===0}),m.jsx("br",{}),m.jsx("br",{}),m.jsx(w,{component:"a",fullWidth:!0,variant:"contained",color:"info",size:"large",disabled:o.apiKey.length===0||o.vendorModel.length===0||o.schemaModel.length===0||d.length===0,onClick:()=>n(!0),children:"Start AI Chatbot"})]})})}v(window.document.getElementById("root")).render(m.jsx(P,{}));
