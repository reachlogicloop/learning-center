// Money-specific visual aid. The shared Safety engine is unchanged.
(()=>{
 const root=document.getElementById('content');
 const amounts={penny:1,nickel:5,dime:10,quarter:25};
 function draw(coins){
  const box=document.createElement('div');box.className='coin-strip';box.setAttribute('role','group');box.setAttribute('aria-label','Coin illustrations');
  for(const coin of coins){
   const tile=document.createElement('div');tile.className='coin-tile';
   const circle=document.createElement('span');circle.className='coin coin-'+coin;circle.setAttribute('aria-hidden','true');circle.textContent=amounts[coin]+'¢';
   const label=document.createElement('span');label.className='coin-label';label.textContent=coin[0].toUpperCase()+coin.slice(1)+' · '+amounts[coin]+'¢';
   tile.append(circle,label);box.append(tile);
  }
  return box;
 }
 function display(){
  if(root.querySelector('.coin-strip'))return;
  const heading=root.querySelector('h2');if(!heading)return;
  const title=heading.firstChild?.textContent?.trim()||'';
  let coins=coinVisuals[title];
  if(title===conceptTitle)coins=Object.keys(amounts);
  if(title==='Learn the words'){
   const word=root.querySelector('.word h3')?.firstChild?.textContent?.trim().toLowerCase();
   if(amounts[word])coins=[word];else if(word==='total')coins=['nickel','dime'];
  }
  if(!coins)return;
  const anchor=title==='Learn the words'?root.querySelector('.word h3'):heading;
  anchor?.after(draw(coins));
 }
 new MutationObserver(display).observe(root,{childList:true});
 display();
})();