!function(){var t={canvas:null,context:null,segSize:6,shake:3,x:0,y:0,prevX:0,prevY:0,width:0,height:0,create:function(t){var h=Object.create(this);return"string"==typeof t&&(t=document.getElementById(t)),h.canvas=t,h.context=h.canvas.getContext("2d"),h.width=h.canvas.width,h.height=h.canvas.height,h},setSize:function(t,h){this.canvas.width=this.width=t,this.canvas.height=this.height=h},clear:function(){this.context.clearRect(0,0,this.width,this.height)},beginPath:function(){this.context.beginPath()},stroke:function(){this.context.stroke()},fill:function(){this.context.fill()},rect:function(t,h,s,i){this.moveTo(t,h);var e=this.x,a=this.y;this.lineTo(t+s,h),this.lineTo(t+s,h+i),this.lineTo(t,h+i),this.lineTo(e,a,!0)},fillRect:function(t,h,s,i){this.beginPath(),this.rect(t,h,s,i),this.fill()},clearRect:function(t,h,s,i){this.context.clearRect(t,h,s,i)},strokeRect:function(t,h,s,i){this.beginPath(),this.rect(t,h,s,i),this.stroke()},moveTo:function(t,h){this._setXY(t+Math.random()*this.shake-this.shake/2,h+Math.random()*this.shake-this.shake/2),this.context.moveTo(this.x,this.y)},lineTo:function(t,h,s){var i=s?t:t+Math.random()*this.shake-this.shake/2,e=s?h:h+Math.random()*this.shake-this.shake/2;dx=i-this.x,dy=e-this.y,dist=Math.sqrt(dx*dx+dy*dy),steps=Math.floor(dist/this.segSize),resX=dx/steps,resY=dy/steps;for(var a=1;a<steps;a++)this.context.lineTo(this.x+resX*a+Math.random()*this.shake-this.shake/2,this.y+resY*a+Math.random()*this.shake-this.shake/2);this.context.lineTo(i,e),this._setXY(i,e)},arc:function(t,h,s,i,e){for(;i>e;)e+=2*Math.PI;this.moveTo(t+Math.cos(i)*s,h+Math.sin(i)*s);for(var a=2*Math.PI/Math.floor(s*Math.PI*2/this.segSize),n=i+a;e>n;n+=a)this.context.lineTo(t+Math.cos(n)*s+Math.random()*this.shake-this.shake/2,h+Math.sin(n)*s+Math.random()*this.shake-this.shake/2);this._setXY(t+Math.cos(e)*s+Math.random()*this.shake-this.shake/2,h+Math.sin(e)*s+Math.random()*this.shake-this.shake/2),this.context.lineTo(this.x,this.y)},circle:function(t,h,s){var i=2*Math.PI/Math.floor(s*Math.PI*2/this.segSize);this.arc(t,h,s,0,2*Math.PI-i),this._setXY(this.prevX,this.prevY),this.context.lineTo(this.x,this.y)},fillCircle:function(t,h,s){this.beginPath(),this.circle(t,h,s),this.fill()},strokeCircle:function(t,h,s){this.beginPath(),this.circle(t,h,s),this.stroke()},ellipse:function(t,h,s,i){this.moveTo(t+s,h);for(var e=2*Math.PI/Math.floor((s+i)/2*Math.PI*2/this.segSize),a=e;a<2*Math.PI-e;a+=e)this.context.lineTo(t+Math.cos(a)*s+Math.random()*this.shake-this.shake/2,h+Math.sin(a)*i+Math.random()*this.shake-this.shake/2);this.context.lineTo(this.x,this.y)},fillEllipse:function(t,h,s,i){this.beginPath(),this.ellipse(t,h,s,i),this.fill()},strokeEllipse:function(t,h,s,i){this.beginPath(),this.ellipse(t,h,s,i),this.stroke()},bezierCurveTo:function(t,h,s,i,e,a){for(var n=this.x,o=this.y,c=this._distance(n,o,t,h)+this._distance(t,h,s,i)+this._distance(s,i,e,a),r=this.segSize/c,l=0;1>l;l+=r)this.context.lineTo(Math.pow(1-l,3)*n+3*Math.pow(1-l,2)*l*t+3*(1-l)*l*l*s+l*l*l*e+Math.random()*this.shake-this.shake/2,Math.pow(1-l,3)*o+3*Math.pow(1-l,2)*l*h+3*(1-l)*l*l*i+l*l*l*a+Math.random()*this.shake-this.shake/2);this._setXY(e+Math.random()*this.shake-this.shake/2,a+Math.random()*this.shake-this.shake/2),this.context.lineTo(this.x,this.y)},quadraticCurveTo:function(t,h,s,i){for(var e=this.x,a=this.y,n=this._distance(e,a,t,h)+this._distance(t,h,s,i),o=this.segSize/n,c=0;1>c;c+=o)this.context.lineTo(Math.pow(1-c,2)*e+2*(1-c)*c*t+c*c*s+Math.random()*this.shake-this.shake/2,Math.pow(1-c,2)*a+2*(1-c)*c*h+c*c*i+Math.random()*this.shake-this.shake/2);this._setXY(s+Math.random()*this.shake-this.shake/2,i+Math.random()*this.shake-this.shake/2),this.context.lineTo(this.x,this.y)},_distance:function(t,h,s,i){var e=s-t,a=i-h;return Math.sqrt(e*e+a*a)},_setXY:function(t,h){this.prevX=this.x,this.prevY=this.y,this.x=t,this.y=h}};"function"==typeof define&&define.amd?define(t):window.shaky=t}();