import{j as m,o as v,r as h,T as b}from"../client-B3aq8qpT.js";import{v as I,A as B,d as A,_ as y,V as g,c as C,F as T,T as j,B as w}from"../VendorConfigurationMovie-DXXxsaqZ.js";import{a as u,_ as p}from"../_isFormatUri-YqTfGpHo.js";import{D as x}from"../Divider-DX1xhf0M.js";class P{constructor(){this.articles=[]}index(){return this.articles}create(c){const d={id:I(),title:c.input.title,body:c.input.body,thumbnail:c.input.thumbnail,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};return this.articles.push(d),d}update(c){const d=this.articles.find(s=>s.id===c.id);if(d===void 0)throw new Error("Unable to find the matched article.");c.input.title!==void 0&&(d.title=c.input.title),c.input.body!==void 0&&(d.body=c.input.body),c.input.thumbnail!==void 0&&(d.thumbnail=c.input.thumbnail),d.updated_at=new Date().toISOString()}erase(c){const d=this.articles.findIndex(s=>s.id===c.id);if(d===-1)throw new Error("Unable to find the matched article.");this.articles.splice(d,1)}}const R={chatgpt:{model:"chatgpt",options:{reference:!0,strict:!1,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:`Primary Key.


@format uuid`,type:"string"},created_at:{description:`Creation time of the article.


@format date-time`,type:"string"},updated_at:{description:`Last updated time of the article.


@format date-time`,type:"string"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"List of every articles",type:"array",items:{$ref:"#/$defs/IBbsArticle"}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:l=>({success:!0,data:l})},{name:"create",parameters:{description:` Properties of create function

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

Writes a new article and archives it into the DB.`,validate:(()=>{const l=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:` Properties of update function

### Description of {@link input} property:

> New content to update.`,type:"object",properties:{id:{description:`Target article's {@link IBbsArticle.id}.


@format uuid`,type:"string"},input:{$ref:"#/$defs/PartialIBbsArticle.ICreate"}},required:["id","input"],additionalProperties:!1,$defs:{"PartialIBbsArticle.ICreate":{description:"Make all properties in T optional",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,anyOf:[{type:"null"},{type:"string",description:`@format uri
@contentMediaType image/*`}]}},required:[]}}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const l=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{description:`Target article's {@link IBbsArticle.id}.


@format uuid`,type:"string"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const l=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||o(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||o(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&l(n);let s,o;return n=>{if(d(n)===!1){s=[],o=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||o(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||o(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]},claude:{model:"claude",options:{reference:!0,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"List of every articles",type:"array",items:{$ref:"#/$defs/IBbsArticle"}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:l=>({success:!0,data:l})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:"Information of the article to create",$ref:"#/$defs/IBbsArticle.ICreate"}},required:["input"],additionalProperties:!1,$defs:{"IBbsArticle.ICreate":{description:"Information of the article to create.",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["title","body","thumbnail"]},IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"Newly created article",$ref:"#/$defs/IBbsArticle"},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const l=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"},input:{description:"New content to update.",$ref:"#/$defs/PartialIBbsArticle.ICreate"}},required:["id","input"],additionalProperties:!1,$defs:{"PartialIBbsArticle.ICreate":{description:"Make all properties in T optional",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:[]}}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const l=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const l=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||o(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||o(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&l(n);let s,o;return n=>{if(d(n)===!1){s=[],o=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||o(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||o(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]},deepseek:{model:"deepseek",options:{reference:!0,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"List of every articles",type:"array",items:{$ref:"#/$defs/IBbsArticle"}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:l=>({success:!0,data:l})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:"Information of the article to create",$ref:"#/$defs/IBbsArticle.ICreate"}},required:["input"],additionalProperties:!1,$defs:{"IBbsArticle.ICreate":{description:"Information of the article to create.",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["title","body","thumbnail"]},IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"Newly created article",$ref:"#/$defs/IBbsArticle"},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const l=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"},input:{description:"New content to update.",$ref:"#/$defs/PartialIBbsArticle.ICreate"}},required:["id","input"],additionalProperties:!1,$defs:{"PartialIBbsArticle.ICreate":{description:"Make all properties in T optional",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:[]}}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const l=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const l=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||o(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||o(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&l(n);let s,o;return n=>{if(d(n)===!1){s=[],o=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||o(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||o(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]},gemini:{model:"gemini",options:{recursive:3,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},required:[]},output:{type:"array",items:{type:"object",properties:{id:{type:"string",description:`Primary Key.


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

List up every articles archived in the BBS DB.`,validate:l=>({success:!0,data:l})},{name:"create",parameters:{type:"object",properties:{input:{type:"object",properties:{title:{type:"string",description:`Title of the article.

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

Writes a new article and archives it into the DB.`,validate:(()=>{const l=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{type:"object",properties:{id:{type:"string",description:`Target article's {@link IBbsArticle.id}.


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

Updates an article with new content.`,validate:(()=>{const l=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{type:"object",properties:{id:{type:"string",description:`Target article's {@link IBbsArticle.id}.


@format uuid`}},required:["id"],description:" Properties of erase function"},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const l=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||o(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||o(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&l(n);let s,o;return n=>{if(d(n)===!1){s=[],o=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||o(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||o(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]},llama:{model:"llama",options:{reference:!0,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"List of every articles",type:"array",items:{$ref:"#/$defs/IBbsArticle"}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:l=>({success:!0,data:l})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:"Information of the article to create",$ref:"#/$defs/IBbsArticle.ICreate"}},required:["input"],additionalProperties:!1,$defs:{"IBbsArticle.ICreate":{description:"Information of the article to create.",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["title","body","thumbnail"]},IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"Newly created article",$ref:"#/$defs/IBbsArticle"},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const l=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"},input:{description:"New content to update.",$ref:"#/$defs/PartialIBbsArticle.ICreate"}},required:["id","input"],additionalProperties:!1,$defs:{"PartialIBbsArticle.ICreate":{description:"Make all properties in T optional",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:[]}}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const l=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const l=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||o(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||o(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&l(n);let s,o;return n=>{if(d(n)===!1){s=[],o=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||o(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||o(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]},"3.0":{model:"3.0",options:{recursive:3,constraint:!0,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[]},output:{type:"array",items:{type:"object",properties:{id:{type:"string",format:"uuid",description:"Primary Key."},created_at:{type:"string",format:"date-time",description:"Creation time of the article."},updated_at:{type:"string",format:"date-time",description:"Last updated time of the article."},title:{type:"string",description:`Title of the article.

Representative title of the article.`},body:{type:"string",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",format:"uri",contentMediaType:"image/*",nullable:!0,description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`}},required:["id","created_at","updated_at","title","body","thumbnail"],description:`Description of the current {@link IBbsArticle} type:

> Article entity.
> 
> \`IBbsArticle\` is an entity representing an article in the BBS (Bulletin Board System).`,additionalProperties:!1},description:"List of every articles"},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:l=>({success:!0,data:l})},{name:"create",parameters:{type:"object",properties:{input:{type:"object",properties:{title:{type:"string",description:`Title of the article.

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

Writes a new article and archives it into the DB.`,validate:(()=>{const l=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{type:"object",properties:{id:{type:"string",format:"uuid",description:"Target article's {@link IBbsArticle.id}."},input:{type:"object",properties:{title:{type:"string",description:`Title of the article.

Representative title of the article.`},body:{type:"string",description:`Content body.

Content body of the article writtn in the markdown format.`},thumbnail:{type:"string",format:"uri",contentMediaType:"image/*",nullable:!0,description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`}},required:[],description:`New content to update.

------------------------------

Description of the current {@link PartialIBbsArticle.ICreate} type:

> Make all properties in T optional`,additionalProperties:!1}},required:["id","input"],description:" Properties of update function",additionalProperties:!1},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const l=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{type:"object",properties:{id:{type:"string",format:"uuid",description:"Target article's {@link IBbsArticle.id}."}},required:["id"],description:" Properties of erase function",additionalProperties:!1},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const l=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||o(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||o(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&l(n);let s,o;return n=>{if(d(n)===!1){s=[],o=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||o(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||o(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]},"3.1":{model:"3.1",options:{reference:!0,constraint:!0,separate:null},functions:[{name:"index",parameters:{type:"object",properties:{},additionalProperties:!1,required:[],$defs:{IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"List of every articles",type:"array",items:{$ref:"#/$defs/IBbsArticle"}},description:`Get all articles.

List up every articles archived in the BBS DB.`,validate:l=>({success:!0,data:l})},{name:"create",parameters:{description:" Properties of create function",type:"object",properties:{input:{description:"Information of the article to create",$ref:"#/$defs/IBbsArticle.ICreate"}},required:["input"],additionalProperties:!1,$defs:{"IBbsArticle.ICreate":{description:"Information of the article to create.",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["title","body","thumbnail"]},IBbsArticle:{description:"Article entity.\n\n`IBbsArticle` is an entity representing an article in the BBS (Bulletin Board System).",type:"object",properties:{id:{description:"Primary Key.",type:"string",format:"uuid"},created_at:{description:"Creation time of the article.",type:"string",format:"date-time"},updated_at:{description:"Last updated time of the article.",type:"string",format:"date-time"},title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:["id","created_at","updated_at","title","body","thumbnail"]}}},output:{description:"Newly created article",$ref:"#/$defs/IBbsArticle"},description:`Create a new article.

Writes a new article and archives it into the DB.`,validate:(()=>{const l=e=>typeof e.input=="object"&&e.input!==null&&c(e.input),c=e=>typeof e.title=="string"&&typeof e.body=="string"&&(e.thumbnail===null||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[(typeof e.input=="object"&&e.input!==null||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"IBbsArticle.ICreate",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[typeof e.title=="string"||r(i,{path:t+".title",expected:"string",value:e.title}),typeof e.body=="string"||r(i,{path:t+".body",expected:"string",value:e.body}),e.thumbnail===null||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"update",parameters:{description:" Properties of update function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"},input:{description:"New content to update.",$ref:"#/$defs/PartialIBbsArticle.ICreate"}},required:["id","input"],additionalProperties:!1,$defs:{"PartialIBbsArticle.ICreate":{description:"Make all properties in T optional",type:"object",properties:{title:{description:`Title of the article.

Representative title of the article.`,type:"string"},body:{description:`Content body.

Content body of the article writtn in the markdown format.`,type:"string"},thumbnail:{description:`Thumbnail image URI.

Thumbnail image URI which can represent the article.

If configured as \`null\`, it means that no thumbnail image in the article.`,oneOf:[{type:"null"},{type:"string",format:"uri",contentMediaType:"image/*"}]}},required:[]}}},description:`Update an article.

Updates an article with new content.`,validate:(()=>{const l=e=>typeof e.id=="string"&&p(e.id)&&typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1&&c(e.input),c=e=>(e.title===void 0||typeof e.title=="string")&&(e.body===void 0||typeof e.body=="string")&&(e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&u(e.thumbnail)),d=(e,t,i=!0)=>[typeof e.id=="string"&&(p(e.id)||r(i,{path:t+".id",expected:'string & Format<"uuid">',value:e.id}))||r(i,{path:t+".id",expected:'(string & Format<"uuid">)',value:e.id}),(typeof e.input=="object"&&e.input!==null&&Array.isArray(e.input)===!1||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input}))&&s(e.input,t+".input",i)||r(i,{path:t+".input",expected:"Partial<IBbsArticle.ICreate>",value:e.input})].every(a=>a),s=(e,t,i=!0)=>[e.title===void 0||typeof e.title=="string"||r(i,{path:t+".title",expected:"(string | undefined)",value:e.title}),e.body===void 0||typeof e.body=="string"||r(i,{path:t+".body",expected:"(string | undefined)",value:e.body}),e.thumbnail===null||e.thumbnail===void 0||typeof e.thumbnail=="string"&&(u(e.thumbnail)||r(i,{path:t+".thumbnail",expected:'string & Format<"uri">',value:e.thumbnail}))||r(i,{path:t+".thumbnail",expected:'((string & Format<"uri"> & ContentMediaType<"image/*">) | null | undefined)',value:e.thumbnail})].every(a=>a),o=e=>typeof e=="object"&&e!==null&&l(e);let n,r;return e=>{if(o(e)===!1){n=[],r=y(n),((i,a,f=!0)=>(typeof i=="object"&&i!==null||r(!0,{path:a+"",expected:"__type",value:i}))&&d(i,a+"",!0)||r(!0,{path:a+"",expected:"__type",value:i}))(e,"$input",!0);const t=n.length===0;return t?{success:t,data:e}:{success:t,errors:n,data:e}}return{success:!0,data:e}}})()},{name:"erase",parameters:{description:" Properties of erase function",type:"object",properties:{id:{description:"Target article's {@link IBbsArticle.id}.",type:"string",format:"uuid"}},required:["id"],additionalProperties:!1,$defs:{}},description:`Erase an article.

Erases an article from the DB.`,validate:(()=>{const l=n=>typeof n.id=="string"&&p(n.id),c=(n,r,e=!0)=>[typeof n.id=="string"&&(p(n.id)||o(e,{path:r+".id",expected:'string & Format<"uuid">',value:n.id}))||o(e,{path:r+".id",expected:'(string & Format<"uuid">)',value:n.id})].every(t=>t),d=n=>typeof n=="object"&&n!==null&&l(n);let s,o;return n=>{if(d(n)===!1){s=[],o=y(s),((e,t,i=!0)=>(typeof e=="object"&&e!==null||o(!0,{path:t+"",expected:"__type",value:e}))&&c(e,t+"",!0)||o(!0,{path:t+"",expected:"__type",value:e}))(n,"$input",!0);const r=s.length===0;return r?{success:r,data:n}:{success:r,errors:s,data:n}}return{success:!0,data:n}}})()}]}};function _(l){const c=new P,d=new B({model:"chatgpt",vendor:{api:l.api,model:l.vendorModel},controllers:[{protocol:"class",name:"bbs",application:R[l.schemaModel],execute:c}],config:{locale:l.locale,timezone:l.timezone,executor:{initialize:null}}});return m.jsx(A,{agent:d})}function $(){const[l,c]=h.useState(g.defaultConfig()),[d,s]=h.useState(window.navigator.language),[o,n]=h.useState(!1);return m.jsx("div",{style:{width:"100%",height:"100%",overflow:o===!0?void 0:"auto"},children:o===!0?m.jsx(_,{api:new C({apiKey:l.apiKey,baseURL:l.baseURL,dangerouslyAllowBrowser:!0}),vendorModel:l.vendorModel,schemaModel:l.schemaModel,locale:d}):m.jsxs(T,{style:{width:"calc(100% - 60px)",padding:15,margin:15},children:[m.jsx(b,{variant:"h6",children:"BBS AI Chatbot"}),m.jsx("br",{}),m.jsx(x,{}),m.jsx("br",{}),"Demonstration of Agentica with TypeScript Controller Class.",m.jsx("br",{}),m.jsx("br",{}),m.jsx(b,{variant:"h6",children:" OpenAI Configuration "}),m.jsx("br",{}),m.jsx(g,{config:l,onChange:c}),m.jsx("br",{}),m.jsx(b,{variant:"h6",children:" Membership Information "}),m.jsx("br",{}),m.jsx(j,{onChange:r=>s(r.target.value),defaultValue:d,label:"Locale",variant:"outlined",error:d.length===0}),m.jsx("br",{}),m.jsx("br",{}),m.jsx(w,{component:"a",fullWidth:!0,variant:"contained",color:"info",size:"large",disabled:l.apiKey.length===0||l.vendorModel.length===0||l.schemaModel.length===0||d.length===0,onClick:()=>n(!0),children:"Start AI Chatbot"})]})})}v(window.document.getElementById("root")).render(m.jsx($,{}));
