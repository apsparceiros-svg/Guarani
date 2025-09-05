class Galeria {
  constructor(containerId, config={}){
    this.container = document.getElementById(containerId);
    this.modal = this.criarModal();

    // Config padrão
    this.config = Object.assign({
      autoplay: true,
      delay: 3000
    }, config);

    this.timer = null;
    this.isPlaying = this.config.autoplay;
  }

  criarModal(){
    const modal=document.createElement('div');
    modal.className="modal";
    modal.innerHTML=`
      <div class="modal-content">
        <span class="close">&times;</span>
        <div id="modal-body"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector(".close").onclick=()=>this.fechar();
    window.addEventListener("keydown", e=>{ if(e.key==="Escape") this.fechar(); });
    modal.onclick=e=>{ if(e.target===modal) this.fechar(); };
    return modal;
  }

  carregarImagens(imgs){
    this.container.innerHTML="";
    imgs.forEach((src,i)=>{
      const img=document.createElement("img");
      img.src=src;
      img.onclick=()=>this.abrir(imgs,i);
      this.container.appendChild(img);
    });
  }

  abrir(imgs, idx){
    let pos=idx;
    const body=this.modal.querySelector("#modal-body");
    body.innerHTML=`
      <div style="position:relative;">
        <img id="main-img" src="${imgs[pos]}" style="width:100%;border-radius:8px;cursor:zoom-in;">
        <span class="nav-arrow nav-left">&#10094;</span>
        <span class="nav-arrow nav-right">&#10095;</span>
        <button class="play-btn">${this.isPlaying ? "Pause" : "Play"}</button>
      </div>
      <div class="miniaturas">${imgs.map((s,i)=>`<img src="${s}" class="${i===pos?'selected':''}">`).join('')}</div>
    `;

    const main=body.querySelector("#main-img");
    const left=body.querySelector(".nav-left");
    const right=body.querySelector(".nav-right");
    const mini=body.querySelectorAll(".miniaturas img");
    const playBtn=body.querySelector(".play-btn");

    const atualizar=i=>{
      pos=(i+imgs.length)%imgs.length;
      main.src=imgs[pos];
      mini.forEach((m,j)=>m.classList.toggle("selected", j===pos));
    };

    left.onclick=()=>{ atualizar(pos-1); this.resetAutoplay(()=>atualizar(pos+1)); };
    right.onclick=()=>{ atualizar(pos+1); this.resetAutoplay(()=>atualizar(pos+1)); };
    mini.forEach((m,i)=>m.onclick=()=>{ atualizar(i); this.resetAutoplay(()=>atualizar(pos+1)); });

    main.onclick=()=>this.abrirOverlay(imgs,pos);

    playBtn.onclick=()=>this.togglePlay(playBtn, ()=>atualizar(pos+1));

    this.modal.classList.add("show");

    if(this.isPlaying){
      this.resetAutoplay(()=>atualizar(pos+1));
    }
  }

  abrirOverlay(imgs, idx){
    let pos=idx;
    const overlay=document.createElement("div");
    overlay.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10000;";

    const img=document.createElement("img");
    img.src=imgs[pos];
    img.style.cssText="max-width:90%;max-height:80%;cursor:zoom-in;transition:transform .3s ease;";
    overlay.appendChild(img);

    const setaEsq=document.createElement("span");
    setaEsq.innerHTML="&#10094;";
    setaEsq.className="nav-arrow nav-left";
    const setaDir=document.createElement("span");
    setaDir.innerHTML="&#10095;";
    setaDir.className="nav-arrow nav-right";
    overlay.appendChild(setaEsq); overlay.appendChild(setaDir);

    const playBtn=document.createElement("button");
    playBtn.className="play-btn";
    playBtn.textContent=this.isPlaying ? "Pause" : "Play";
    overlay.appendChild(playBtn);

    const atualizar=i=>{ pos=(i+imgs.length)%imgs.length; img.src=imgs[pos]; resetZoom(); };

    setaEsq.onclick=()=>{ atualizar(pos-1); this.resetAutoplay(()=>atualizar(pos+1)); };
    setaDir.onclick=()=>{ atualizar(pos+1); this.resetAutoplay(()=>atualizar(pos+1)); };

    playBtn.onclick=()=>this.togglePlay(playBtn, ()=>atualizar(pos+1));

    // Miniaturas
    const miniContainer=document.createElement("div");
    miniContainer.className="miniaturas";
    imgs.forEach((s,i)=>{
      const m=document.createElement("img");
      m.src=s;
      if(i===pos) m.classList.add("selected");
      m.onclick=()=>{ atualizar(i); [...miniContainer.children].forEach(x=>x.classList.remove("selected")); m.classList.add("selected"); this.resetAutoplay(()=>atualizar(pos+1)); };
      miniContainer.appendChild(m);
    });
    overlay.appendChild(miniContainer);

    // Zoom
    let zoom=false, tx=0, ty=0, dragging=false, startX=0, startY=0;
    const resetZoom=()=>{ zoom=false; tx=0; ty=0; img.style.transform="scale(1) translate(0,0)"; img.style.cursor="zoom-in"; };
    img.onclick=()=>{ if(!zoom){ zoom=true; img.style.transform=`scale(2) translate(0,0)`; img.style.cursor="move"; } else resetZoom(); };
    img.addEventListener("mousedown", e=>{ if(zoom){ dragging=true; startX=e.clientX-tx; startY=e.clientY-ty; img.style.cursor="grabbing"; }});
    window.addEventListener("mousemove", e=>{ if(dragging){ tx=e.clientX-startX; ty=e.clientY-startY; img.style.transform=`scale(2) translate(${tx}px,${ty}px)`; }});
    window.addEventListener("mouseup", ()=>{ dragging=false; if(zoom) img.style.cursor="move"; });

    overlay.onclick=e=>{ if(e.target===overlay) document.body.removeChild(overlay); };
    window.addEventListener("keydown", function escHandler(e){ if(e.key==="Escape" && document.body.contains(overlay)){ document.body.removeChild(overlay); window.removeEventListener("keydown", escHandler); }});

    document.body.appendChild(overlay);

    if(this.isPlaying){
      this.resetAutoplay(()=>atualizar(pos+1));
    }
  }

  resetAutoplay(callback){
    if(this.timer) clearInterval(this.timer);
    if(this.isPlaying){
      this.timer=setInterval(callback, this.config.delay);
    }
  }

  togglePlay(btn, callback){
    this.isPlaying = !this.isPlaying;
    btn.textContent = this.isPlaying ? "Pause" : "Play";
    if(this.isPlaying){
      this.resetAutoplay(callback);
    } else {
      if(this.timer) clearInterval(this.timer);
    }
  }

  fechar(){
    this.modal.classList.remove("show");
    if(this.timer) clearInterval(this.timer);
  }
}
