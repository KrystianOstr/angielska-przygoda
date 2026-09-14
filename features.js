const LISTEN_STATE={category:CATEGORIES.animals,sourceItems:[],questions:[],index:0,current:null,options:[],solved:false};
const SHORT_STATE={level:1,family:"mix",index:0,current:null,solved:false,correct:0,previousKey:null};
const SHORT_FAMILIES=["have","like","be","want","can"];
const SHORT_LEVELS={
  1:{label:"JA",subjects:["i"]},
  2:{label:"TY, ON, ONA, ONO",subjects:["youOne","he","she","it"]},
  3:{label:"WY, MY, ONI",subjects:["youMany","we","they"]},
  4:{label:"MIX WSZYSTKICH OSÓB",subjects:["i","youOne","he","she","it","youMany","we","they"]}
};
const SHORT_ANSWER_SUBJECTS={i:"you",youOne:"I",he:"he",she:"she",it:"it",youMany:"we",we:"we",they:"they"};

function featureBurst(selector){
  const box=$(selector),colors=["#ff6b4a","#ffc93c","#1fb8a6","#7c5cfc","#3dd68c"];
  box.innerHTML="";
  for(let i=0;i<24;i++){
    const piece=document.createElement("i");
    piece.className="piece";
    piece.style.left=Math.random()*100+"%";
    piece.style.background=colors[i%colors.length];
    piece.style.animationDelay=Math.random()*.15+"s";
    box.appendChild(piece);
  }
  setTimeout(()=>box.innerHTML="",1300);
}

function listenRenderOptions(){
  const box=$("#listen-options");
  box.innerHTML="";
  LISTEN_STATE.options.forEach((item,index)=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="listen-option";
    button.dataset.id=item.id;
    button.ariaLabel=`ODPOWIEDŹ ${index+1}`;
    button.innerHTML=guessItemPicture(item);
    button.onclick=()=>listenChoose(item,button);
    box.appendChild(button);
  });
}

function listenRenderQuestion(){
  const target=LISTEN_STATE.questions[LISTEN_STATE.index];
  const distractors=shuffle(LISTEN_STATE.sourceItems.filter(item=>item.id!==target.id)).slice(0,3);
  LISTEN_STATE.current=target;
  LISTEN_STATE.options=shuffle([target,...distractors]);
  LISTEN_STATE.solved=false;
  $("#listen-index").textContent=LISTEN_STATE.index+1;
  $("#listen-total").textContent=LISTEN_STATE.questions.length;
  $("#listen-feedback").textContent="POSŁUCHAJ I WSKAŻ OBRAZEK";
  $("#listen-feedback").className="guess-feedback";
  $("#listen-next").classList.add("hidden");
  listenRenderOptions();
  speak(target.en);
}

function listenChoose(item,button){
  if(LISTEN_STATE.solved)return;
  if(item.id!==LISTEN_STATE.current.id){
    tone(false);
    button.classList.add("guess-wrong");
    setTimeout(()=>button.classList.remove("guess-wrong"),480);
    return;
  }
  LISTEN_STATE.solved=true;
  button.classList.add("guess-correct");
  $("#listen-feedback").textContent=`BRAWO! ${item.en.toUpperCase()}`;
  $("#listen-feedback").className="guess-feedback ok";
  $("#listen-next").classList.remove("hidden");
  speak(item.en);
  tone(true);
  featureBurst("#listen-confetti");
}

function listenNext(){
  if(!LISTEN_STATE.solved)return;
  if(LISTEN_STATE.index+1<LISTEN_STATE.questions.length){
    LISTEN_STATE.index++;
    listenRenderQuestion();
    return;
  }
  $("#listen-finish").classList.remove("hidden");
}

function listenStart(items){
  LISTEN_STATE.sourceItems=[...items];
  LISTEN_STATE.questions=guessQuestions(items);
  LISTEN_STATE.index=0;
  $("#listen-finish").classList.add("hidden");
  show("listen-game");
  listenRenderQuestion();
}

function listenRenderSets(){
  const box=$("#listen-set-options"),groups=learningSets(LISTEN_STATE.category.items);
  $("#listen-sets-subtitle").textContent=`${LISTEN_STATE.category.emoji} ${LISTEN_STATE.category.name} — 10 PYTAŃ`;
  box.innerHTML="";
  groups.forEach((group,index)=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="cat set-card listen-set";
    button.innerHTML=`<span class="set-number">${index+1}</span><span class="title">ZESTAW ${index+1}</span><span class="soon">SŁOWA ${group.start}–${group.end}</span>`;
    button.onclick=()=>listenStart(group.items);
    box.appendChild(button);
  });
  const mix=document.createElement("button");
  mix.type="button";
  mix.className="cat set-card listen-set";
  mix.innerHTML='<span class="emoji">🎲</span><span class="title">MIX</span><span class="soon">10 LOSOWYCH PYTAŃ</span>';
  mix.onclick=()=>listenStart(LISTEN_STATE.category.items);
  box.appendChild(mix);
}

function listenOpenSets(category,backTarget){
  LISTEN_STATE.category=category;
  $("#listen-sets-back").dataset.target=backTarget;
  listenRenderSets();
  show("listen-sets");
}

function shortAnswerText(subjectKey,family,positive){
  const answerSubject=SHORT_ANSWER_SUBJECTS[subjectKey];
  let auxiliary;
  if(family==="be"){
    const answerBe=answerSubject==="I"?"am":["he","she","it"].includes(answerSubject)?"is":"are";
    if(!positive&&answerSubject==="I")return "no, I'm not.";
    auxiliary=positive?answerBe:answerBe==="am"?"am not":answerBe==="is"?"isn't":"aren't";
  }else if(family==="can"){
    auxiliary=positive?"can":"can't";
  }else{
    const singular=["he","she","it"].includes(answerSubject);
    auxiliary=positive?(singular?"does":"do"):(singular?"doesn't":"don't");
  }
  return `${positive?"yes":"no"}, ${answerSubject} ${auxiliary}.`;
}

function shortPickSubjectKey(level=SHORT_STATE.level){
  const subjects=SHORT_LEVELS[level].subjects;
  return subjects[Math.floor(Math.random()*subjects.length)];
}

function shortNegativePicture(html){
  return `<div class="short-negative-picture"><div class="short-picture-content">${html}</div><span class="sentence-negative-mark" aria-hidden="true"></span></div>`;
}

function shortBuildRound(family=SHORT_STATE.family,subjectKey=shortPickSubjectKey(),positive=Math.random()<.5){
  if(family==="mix")family=SHORT_FAMILIES[Math.floor(Math.random()*SHORT_FAMILIES.length)];
  const question=sentenceQuestionRound(family,subjectKey);
  return{
    key:`${question.key}-${positive?"yes":"no"}`,
    family,
    subjectKey,
    positive,
    question:question.sentence,
    polishQuestion:question.polishSentence,
    correctAnswer:shortAnswerText(subjectKey,family,positive),
    wrongAnswer:shortAnswerText(subjectKey,family,!positive),
    pictureHtml:positive?question.pictureHtml:shortNegativePicture(question.pictureHtml)
  };
}

function shortRenderAnswers(){
  const box=$("#short-answers");
  box.innerHTML="";
  [true,false].forEach(positive=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="short-answer";
    button.dataset.positive=positive;
    button.textContent=shortAnswerText(SHORT_STATE.current.subjectKey,SHORT_STATE.current.family,positive).toUpperCase();
    button.onclick=()=>shortChoose(positive,button);
    box.appendChild(button);
  });
}

function shortCreateRound(){
  let round;
  do{round=shortBuildRound()}while(round.key===SHORT_STATE.previousKey);
  SHORT_STATE.previousKey=round.key;
  SHORT_STATE.current=round;
  SHORT_STATE.solved=false;
  $("#short-index").textContent=SHORT_STATE.index+1;
  $("#short-question").textContent=round.question.toUpperCase();
  $("#short-polish").textContent=round.polishQuestion.toUpperCase();
  $("#short-picture").innerHTML=round.pictureHtml;
  $("#short-feedback").textContent="WYBIERZ ODPOWIEDŹ PASUJĄCĄ DO OBRAZKA";
  $("#short-feedback").className="guess-feedback";
  $("#short-next").classList.add("hidden");
  shortRenderAnswers();
}

function shortChoose(positive,button){
  if(SHORT_STATE.solved)return;
  const chosen=shortAnswerText(SHORT_STATE.current.subjectKey,SHORT_STATE.current.family,positive);
  sentenceSpeak(chosen,"en-US",.82);
  if(positive!==SHORT_STATE.current.positive){
    tone(false);
    button.classList.add("guess-wrong");
    setTimeout(()=>button.classList.remove("guess-wrong"),480);
    return;
  }
  SHORT_STATE.solved=true;
  SHORT_STATE.correct++;
  button.classList.add("guess-correct");
  $("#short-feedback").textContent=`BRAWO! ${chosen.toUpperCase()}`;
  $("#short-feedback").className="guess-feedback ok";
  $("#short-next").classList.remove("hidden");
  tone(true);
  featureBurst("#short-confetti");
}

function shortNext(){
  if(!SHORT_STATE.solved)return;
  if(SHORT_STATE.index<9){
    SHORT_STATE.index++;
    shortCreateRound();
    return;
  }
  $("#short-result").textContent=SHORT_STATE.correct;
  $("#short-finish").classList.remove("hidden");
}

function shortStart(family){
  SHORT_STATE.family=family;
  SHORT_STATE.index=0;
  SHORT_STATE.correct=0;
  SHORT_STATE.previousKey=null;
  $("#short-finish").classList.add("hidden");
  $("#short-game-family").textContent=family==="mix"?"WIELKI MIX":SENTENCE_FAMILIES[family].label;
  show("short-game");
  shortCreateRound();
}

function shortRenderFamilies(){
  const box=$("#short-family-options");
  box.innerHTML="";
  SHORT_FAMILIES.forEach(key=>{
    const family=SENTENCE_FAMILIES[key];
    const button=sentenceMenuButton(box,family.emoji,family.label,"10 KRÓTKICH ODPOWIEDZI",()=>shortStart(key));
    button.dataset.shortFamily=key;
  });
  const mix=sentenceMenuButton(box,"🎲","WIELKI MIX","WSZYSTKIE KONSTRUKCJE",()=>shortStart("mix"));
  mix.dataset.shortFamily="mix";
  $("#short-category-subtitle").textContent=`POZIOM ${SHORT_STATE.level}: ${SHORT_LEVELS[SHORT_STATE.level].label}`;
}

function shortOpenLevel(level){
  SHORT_STATE.level=level;
  shortRenderFamilies();
  show("short-categories");
}

$("#listen-play").onclick=()=>show("listen-categories");
document.querySelectorAll(".listen-category").forEach(button=>button.onclick=()=>{
  const key=button.dataset.category;
  if(key==="food")show("listen-food-subcategories");
  else if(key==="numbers")show("listen-number-subcategories");
  else listenOpenSets(CATEGORIES[key],"listen-categories");
});
document.querySelectorAll(".listen-food-subcategory").forEach(button=>button.onclick=()=>listenOpenSets(FOOD_SUBCATEGORIES[button.dataset.food],"listen-food-subcategories"));
document.querySelectorAll(".listen-number-subcategory").forEach(button=>button.onclick=()=>listenOpenSets(NUMBER_SUBCATEGORIES[button.dataset.numbers],"listen-number-subcategories"));
$("#listen-repeat").onclick=()=>{if(LISTEN_STATE.current)speak(LISTEN_STATE.current.en)};
$("#listen-next").onclick=listenNext;
$("#listen-replay").onclick=()=>listenStart(LISTEN_STATE.sourceItems);
$("#listen-topics").onclick=()=>{$("#listen-finish").classList.add("hidden");show("listen-sets")};

$("#short-play").onclick=()=>show("short-levels");
document.querySelectorAll(".short-level").forEach(button=>button.onclick=()=>shortOpenLevel(Number(button.dataset.shortLevel)));
$("#short-question-speaker").onclick=()=>{if(SHORT_STATE.current)sentenceSpeak(SHORT_STATE.current.question,"en-US",.82)};
$("#short-next").onclick=shortNext;
$("#short-replay").onclick=()=>shortStart(SHORT_STATE.family);
$("#short-topics").onclick=()=>{$("#short-finish").classList.add("hidden");show("short-categories")};

