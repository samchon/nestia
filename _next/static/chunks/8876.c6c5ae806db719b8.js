"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8876],{73630:function(t,e,a){function r(t,e){t.accDescr&&e.setAccDescription?.(t.accDescr),t.accTitle&&e.setAccTitle?.(t.accTitle),t.title&&e.setDiagramTitle?.(t.title)}a.d(e,{A:function(){return r}}),(0,a(58222).eW)(r,"populateCommonDb")},18876:function(t,e,a){a.d(e,{diagram:function(){return C}});var r=a(73630),l=a(68414),o=a(1757),c=a(58222),i=a(12491),n={packet:[]},s=structuredClone(n),d=c.vZ.packet,k=(0,c.eW)(()=>{let t=(0,l.Rb)({...d,...(0,c.iE)().packet});return t.showBits&&(t.paddingY+=10),t},"getConfig"),p=(0,c.eW)(()=>s.packet,"getPacket"),b={pushWord:(0,c.eW)(t=>{t.length>0&&s.packet.push(t)},"pushWord"),getPacket:p,getConfig:k,clear:(0,c.eW)(()=>{(0,c.ZH)(),s=structuredClone(n)},"clear"),setAccTitle:c.GN,getAccTitle:c.eu,setDiagramTitle:c.g2,getDiagramTitle:c.Kr,getAccDescription:c.Mx,setAccDescription:c.U$},u=(0,c.eW)(t=>{(0,r.A)(t,b);let e=-1,a=[],l=1,{bitsPerRow:o}=b.getConfig();for(let{start:r,end:i,label:n}of t.blocks){if(i&&i<r)throw Error(`Packet block ${r} - ${i} is invalid. End must be greater than start.`);if(r!==e+1)throw Error(`Packet block ${r} - ${i??r} is not contiguous. It should start from ${e+1}.`);for(e=i??r,c.cM.debug(`Packet block ${r} - ${e} with label ${n}`);a.length<=o+1&&b.getPacket().length<1e4;){let[t,e]=f({start:r,end:i,label:n},l,o);if(a.push(t),t.end+1===l*o&&(b.pushWord(a),a=[],l++),!e)break;({start:r,end:i,label:n}=e)}}b.pushWord(a)},"populate"),f=(0,c.eW)((t,e,a)=>{if(void 0===t.end&&(t.end=t.start),t.start>t.end)throw Error(`Block start ${t.start} is greater than block end ${t.end}.`);return t.end+1<=e*a?[t,void 0]:[{start:t.start,end:e*a-1,label:t.label},{start:e*a,end:t.end,label:t.label}]},"getNextFittingBlock"),g={parse:(0,c.eW)(async t=>{let e=await (0,i.Qc)("packet",t);c.cM.debug(e),u(e)},"parse")},h=(0,c.eW)((t,e,a,r)=>{let l=r.db,i=l.getConfig(),{rowHeight:n,paddingY:s,bitWidth:d,bitsPerRow:k}=i,p=l.getPacket(),b=l.getDiagramTitle(),u=n+s,f=u*(p.length+1)-(b?0:n),g=d*k+2,h=(0,o.P)(e);for(let[t,e]of(h.attr("viewbox",`0 0 ${g} ${f}`),(0,c.v2)(h,f,g,i.useMaxWidth),p.entries()))x(h,e,t,i);h.append("text").text(b).attr("x",g/2).attr("y",f-u/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),x=(0,c.eW)((t,e,a,{rowHeight:r,paddingX:l,paddingY:o,bitWidth:c,bitsPerRow:i,showBits:n})=>{let s=t.append("g"),d=a*(r+o)+o;for(let t of e){let e=t.start%i*c+1,a=(t.end-t.start+1)*c-l;if(s.append("rect").attr("x",e).attr("y",d).attr("width",a).attr("height",r).attr("class","packetBlock"),s.append("text").attr("x",e+a/2).attr("y",d+r/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(t.label),!n)continue;let o=t.end===t.start,k=d-2;s.append("text").attr("x",e+(o?a/2:0)).attr("y",k).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",o?"middle":"start").text(t.start),o||s.append("text").attr("x",e+a).attr("y",k).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(t.end)}},"drawWord"),$={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},C={parser:g,db:b,renderer:{draw:h},styles:(0,c.eW)(({packet:t}={})=>{let e=(0,l.Rb)($,t);return`
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