"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1482],{39685:function(t,e,a){function r(t,e){t.accDescr&&e.setAccDescription?.(t.accDescr),t.accTitle&&e.setAccTitle?.(t.accTitle),t.title&&e.setDiagramTitle?.(t.title)}a.d(e,{A:function(){return r}}),(0,a(32426).eW)(r,"populateCommonDb")},91482:function(t,e,a){a.d(e,{diagram:function(){return C}});var r=a(39685),l=a(8111),o=a(21749),i=a(32426),n=a(12491),c={packet:[]},s=structuredClone(c),d=i.vZ.packet,k=(0,i.eW)(()=>{let t=(0,l.Rb)({...d,...(0,i.iE)().packet});return t.showBits&&(t.paddingY+=10),t},"getConfig"),p=(0,i.eW)(()=>s.packet,"getPacket"),b={pushWord:(0,i.eW)(t=>{t.length>0&&s.packet.push(t)},"pushWord"),getPacket:p,getConfig:k,clear:(0,i.eW)(()=>{(0,i.ZH)(),s=structuredClone(c)},"clear"),setAccTitle:i.GN,getAccTitle:i.eu,setDiagramTitle:i.g2,getDiagramTitle:i.Kr,getAccDescription:i.Mx,setAccDescription:i.U$},f=(0,i.eW)(t=>{(0,r.A)(t,b);let e=-1,a=[],l=1,{bitsPerRow:o}=b.getConfig();for(let{start:r,end:n,bits:c,label:s}of t.blocks){if(void 0!==r&&void 0!==n&&n<r)throw Error(`Packet block ${r} - ${n} is invalid. End must be greater than start.`);if((r??=e+1)!==e+1)throw Error(`Packet block ${r} - ${n??r} is not contiguous. It should start from ${e+1}.`);if(0===c)throw Error(`Packet block ${r} is invalid. Cannot have a zero bit field.`);for(n??=r+(c??1)-1,c??=n-r+1,e=n,i.cM.debug(`Packet block ${r} - ${e} with label ${s}`);a.length<=o+1&&b.getPacket().length<1e4;){let[t,e]=h({start:r,end:n,bits:c,label:s},l,o);if(a.push(t),t.end+1===l*o&&(b.pushWord(a),a=[],l++),!e)break;({start:r,end:n,bits:c,label:s}=e)}}b.pushWord(a)},"populate"),h=(0,i.eW)((t,e,a)=>{if(void 0===t.start)throw Error("start should have been set during first phase");if(void 0===t.end)throw Error("end should have been set during first phase");if(t.start>t.end)throw Error(`Block start ${t.start} is greater than block end ${t.end}.`);if(t.end+1<=e*a)return[t,void 0];let r=e*a-1,l=e*a;return[{start:t.start,end:r,label:t.label,bits:r-t.start},{start:l,end:t.end,label:t.label,bits:t.end-l}]},"getNextFittingBlock"),u={parse:(0,i.eW)(async t=>{let e=await (0,n.Qc)("packet",t);i.cM.debug(e),f(e)},"parse")},g=(0,i.eW)((t,e,a,r)=>{let l=r.db,n=l.getConfig(),{rowHeight:c,paddingY:s,bitWidth:d,bitsPerRow:k}=n,p=l.getPacket(),b=l.getDiagramTitle(),f=c+s,h=f*(p.length+1)-(b?0:c),u=d*k+2,g=(0,o.P)(e);for(let[t,e]of(g.attr("viewbox",`0 0 ${u} ${h}`),(0,i.v2)(g,h,u,n.useMaxWidth),p.entries()))x(g,e,t,n);g.append("text").text(b).attr("x",u/2).attr("y",h-f/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),x=(0,i.eW)((t,e,a,{rowHeight:r,paddingX:l,paddingY:o,bitWidth:i,bitsPerRow:n,showBits:c})=>{let s=t.append("g"),d=a*(r+o)+o;for(let t of e){let e=t.start%n*i+1,a=(t.end-t.start+1)*i-l;if(s.append("rect").attr("x",e).attr("y",d).attr("width",a).attr("height",r).attr("class","packetBlock"),s.append("text").attr("x",e+a/2).attr("y",d+r/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(t.label),!c)continue;let o=t.end===t.start,k=d-2;s.append("text").attr("x",e+(o?a/2:0)).attr("y",k).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",o?"middle":"start").text(t.start),o||s.append("text").attr("x",e+a).attr("y",k).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(t.end)}},"drawWord"),$={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},C={parser:u,db:b,renderer:{draw:g},styles:(0,i.eW)(({packet:t}={})=>{let e=(0,l.Rb)($,t);return`
	.packetByte {
		font-size: ${e.byteFontSize};
	}
	.packetByte.start {
		fill: ${e.startByteColor};
	}
	.packetByte.end {
		fill: ${e.endByteColor};
	}
	.packetLabel {
		fill: ${e.labelColor};
		font-size: ${e.labelFontSize};
	}
	.packetTitle {
		fill: ${e.titleColor};
		font-size: ${e.titleFontSize};
	}
	.packetBlock {
		stroke: ${e.blockStrokeColor};
		stroke-width: ${e.blockStrokeWidth};
		fill: ${e.blockFillColor};
	}
	`},"styles")}}}]);