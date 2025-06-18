 (() => {
      // Data
      const questionsPool = [
        {
          level: 1,
          questions: [
            {id:1, question:"What does HTML stand for?", answers:["HyperText Markup Language", "HyperText Markdown Language", "Hyperloop Machine Language", "HyperText Managed Language"], correctIndex:0},
            {id:2, question:"Inside which HTML element do we put the JavaScript?", answers:["<js>", "<script>", "<javascript>", "<code>"], correctIndex:1},
            {id:3, question:"Which symbol is used for comments in JavaScript?", answers:["//", "<!-- -->", "#", "/* */"], correctIndex:0},
            {id:4, question:"Which company developed the JavaScript language?", answers:["Microsoft", "Apple", "Netscape", "Google"], correctIndex:2},
            {id:5, question:"Which of these is NOT a JavaScript data type?", answers:["Boolean", "Number", "Float", "String"], correctIndex:2}
          ],
        },
        {
          level: 2,
          questions: [
            {id:101, question:"What keyword is used to declare a variable in JavaScript?", answers:["var", "let", "const", "All of the above"], correctIndex:3},
            {id:102, question:"What does CSS stand for?", answers:["Creative Style Sheets", "Colorful Style Sheets", "Cascading Style Sheets", "Computer Style Sheets"], correctIndex:2},
            {id:103, question:"Which method can be used to select an element by ID in JavaScript?", answers:["getElementById()", "querySelectorAll()", "getElementsByClassName()", "getElementsByTagName()"], correctIndex:0},
            {id:104, question:"What is the correct syntax for a function in JavaScript?", answers:["function = myFunc()", "function myFunc()", "func myFunc()", "function:myFunc()"], correctIndex:1},
            {id:105, question:"Which operator is used to assign a value?", answers:["*", "=", "==", "+"], correctIndex:1},
          ],
        },
        {
          level: 3,
          questions: [
            {id:201, question:"What is closure in JavaScript?", answers:["A function bundled with its lexical environment", "A global variable", "A method to close the browser window", "An error in script"], correctIndex:0},
            {id:202, question:"Which of the following is a JavaScript framework?", answers:["Django", "React", "Flask", "Laravel"], correctIndex:1},
            {id:203, question:"Which event occurs when the user clicks on an HTML element?", answers:["onmouseclick", "onclick", "onchange", "onmouseover"], correctIndex:1},
            {id:204, question:"How do you declare a JavaScript array?", answers:["var arr = [];", "var arr = ();", "var arr = {};", "var arr = <>;"], correctIndex:0},
            {id:205, question:"What will the typeof null return?", answers:["object", "null", "undefined", "boolean"], correctIndex:0},
          ],
        },
      ];
      const achievementsData = [
        {id:'firstCorrect', name:'First Correct Answer', description:'Answer your first question correctly.', icon:'check_circle', unlocked:false, reward:10},
        {id:'fiveCorrect', name:'5 Correct Answers', description:'Answer five questions correctly.', icon:'military_tech', unlocked:false, reward:50},
        {id:'levelUp', name:'Level Up', description:'Reach Level 2.', icon:'arrow_upward', unlocked:false, reward:30},
        {id:'level3', name:'Master Coder', description:'Reach Level 3 - advanced quiz!', icon:'star', unlocked:false, reward:100},
        {id:'noMistakes', name:'Perfection', description:'Answer 10 questions in a row correctly.', icon:'emoji_events', unlocked:false, reward:200},
      ];
      const MAX_TIMER = 30;
      const gameState = {
        level:1,
        score:0,
        lives:3,
        timer: MAX_TIMER,
        currentQuestionIndex:0,
        currentQuestionSet:[],
        selectedAnswer:null,
        isPaused:false,
        isGameOver:false,
        combo:0,
        powerUps:{hint:3, skip:2},
        achievements:JSON.parse(localStorage.getItem('quizAchievements')) || JSON.parse(JSON.stringify(achievementsData)),
        highScores: JSON.parse(localStorage.getItem('quizHighScores')) || [],
      };
      // UI Elements
      const scoreEl = document.getElementById('score');
      const levelEl = document.getElementById('level');
      const livesEl = document.getElementById('lives');
      const timerEl = document.getElementById('timer');
      const questionNumberEl = document.getElementById('question-number');
      const questionTextEl = document.getElementById('question-text');
      const answersListEl = document.getElementById('answers-list');
      const achievementPopupEl = document.getElementById('achievement-popup');
      const achievementMessageEl = document.getElementById('achievement-message');
      const achievementListEl = document.getElementById('achievement-list');
      const hintBtn = document.getElementById('hint-btn');
      const skipBtn = document.getElementById('skip-btn');
      const pauseBtn = document.getElementById('pause-btn');
      const toggleSidebarBtn = document.getElementById('toggle-sidebar');
      const sidebarEl = document.querySelector('aside.sidebar');
      const pauseModal = document.getElementById('pause-modal');
      const resumeBtn = document.getElementById('resume-btn');
      const gameOverModal = document.getElementById('gameover-modal');
      const finalScoreText = document.getElementById('final-score-text');
      const finalLevelText = document.getElementById('final-level-text');
      const restartBtn = document.getElementById('restart-btn');
      const particleContainer = document.getElementById('particle-container');
      let lastFrameTime = 0;
      let elapsedTimer = 0;
      let answeredThisQuestion = false;
      let sidebarCollapsed = false;
      let answerButtons = [];
      // Audio (simple beeps)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      function playBeep(freq, dur=150) {
        try {
          const osc = audioContext.createOscillator();
          osc.type='sine';
          osc.frequency.setValueAtTime(freq, audioContext.currentTime);
          osc.connect(audioContext.destination);
          osc.start();
          osc.stop(audioContext.currentTime + dur/1000);
        } catch(e){}
      }
      function playSound(name){
        if(document.hidden) return;
        switch(name){
          case'correct':playBeep(880);break;
          case'incorrect':playBeep(220);break;
          case'powerup':playBeep(660);break;
          case'achievement':playBeep(1100,300);break;
          case'collision':playBeep(300);break;
        }
      }
      function shuffleArray(arr){
        for(let i=arr.length-1;i>0;i--){
          const j = Math.floor(Math.random()*(i+1));
          [arr[i],arr[j]]=[arr[j],arr[i]];
        }
      }
      function loadLevelQuestions(level){
        const levelData = questionsPool.find(l=>l.level===level);
        if(!levelData)return[];
        const copy = [...levelData.questions];
        shuffleArray(copy);
        return copy;
      }
      function updateUI(){
        scoreEl.textContent=gameState.score;
        levelEl.textContent=gameState.level;
        livesEl.textContent=gameState.lives;
        timerEl.textContent=gameState.timer;
      }
      function renderQuestion(){
        const q = gameState.currentQuestionSet[gameState.currentQuestionIndex];
        if(!q)return;
        questionNumberEl.textContent=`Question ${gameState.currentQuestionIndex+1}`;
        questionTextEl.textContent=q.question;
        answersListEl.innerHTML='';
        answerButtons=[];
        q.answers.forEach((answerText,idx)=>{
          const btn=document.createElement('button');
          btn.textContent=answerText;
          btn.disabled=false;
          btn.dataset.index=idx;
          btn.setAttribute('role','listitem');
          btn.addEventListener('click',onAnswerSelected);
          answerButtons.push(btn);
          answersListEl.appendChild(btn);
        });
        answeredThisQuestion=false;
        gameState.selectedAnswer=null;
        hintBtn.disabled=gameState.powerUps.hint<=0;
        skipBtn.disabled=gameState.powerUps.skip<=0;
        updateUI();
      }
      function onAnswerSelected(event){
        if(answeredThisQuestion||gameState.isPaused||gameState.isGameOver)return;
        const btn=event.currentTarget;
        selectAnswer(btn.dataset.index);
      }
      function selectAnswer(indexStr){
        const index=parseInt(indexStr,10);
        gameState.selectedAnswer=index;
        answerButtons.forEach(btn=>btn.disabled=true);
        checkAnswer();
      }
      function checkAnswer(){
        const question=gameState.currentQuestionSet[gameState.currentQuestionIndex];
        if(!question)return;
        answeredThisQuestion=true;
        if(gameState.selectedAnswer===question.correctIndex){
          answerButtons[gameState.selectedAnswer].classList.add('correct');
          incrementScore(10*gameState.level);
          incrementCombo();
          playSound('correct');
          createParticleEffect(answerButtons[gameState.selectedAnswer].offsetLeft+answerButtons[gameState.selectedAnswer].offsetWidth/2,answerButtons[gameState.selectedAnswer].offsetTop+answerButtons[gameState.selectedAnswer].offsetHeight/2);
          checkAchievements('correct');
          setTimeout(()=>nextQuestion(),1200);
        }else{
          if(gameState.selectedAnswer!==null&&answerButtons[gameState.selectedAnswer]){
            answerButtons[gameState.selectedAnswer].classList.add('incorrect');
          }
          answerButtons[question.correctIndex].classList.add('correct');
          resetCombo();
          loseLife();
          playSound('incorrect');
          setTimeout(()=>{
            if(!gameState.isGameOver) nextQuestion();
          },1500);
        }
      }
      function incrementScore(amount){
        gameState.score+=amount;
        updateUI();
      }
      function incrementCombo(){
        gameState.combo++;
        if(gameState.combo>=10){
          unlockAchievement('noMistakes');
        }
      }
      function resetCombo(){
        gameState.combo=0;
      }
      function loseLife(){
        gameState.lives--;
        updateUI();
        if(gameState.lives<=0){
          triggerGameOver();
        }
      }
      function nextQuestion(){
        if(gameState.isGameOver)return;
        gameState.currentQuestionIndex++;
        if(gameState.currentQuestionIndex>=gameState.currentQuestionSet.length){
          increaseLevel();
        }else{
          resetTimer();
          renderQuestion();
        }
      }
      function increaseLevel(){
        if(gameState.level<3){
          gameState.level++;
          unlockAchievement(gameState.level===2?'levelUp':'level3');
          gameState.currentQuestionSet=loadLevelQuestions(gameState.level);
          gameState.currentQuestionIndex=0;
          resetTimer();
          renderQuestion();
          updateUI();
          showLevelUpMessage();
        }else{
          triggerGameOver();
        }
      }
      function showLevelUpMessage(){
        const levelUpText=document.createElement('div');
        levelUpText.textContent=`Level ${gameState.level} - Challenge increased!`;
        Object.assign(levelUpText.style,{
          position:'fixed',
          top:'50%',
          left:'50%',
          transform:'translate(-50%, -50%)',
          background:'rgba(0, 255, 247, 0.9)',
          borderRadius:'20px',
          padding:'24px 36px',
          fontSize:'1.8rem',
          color:'#002022',
          fontWeight:'900',
          zIndex:'1000',
          boxShadow:'0 0 30px #00fff7',
        });
        document.body.appendChild(levelUpText);
        setTimeout(()=>{levelUpText.remove()},2500);
      }
      function resetTimer(){
        gameState.timer=MAX_TIMER;
      }
      function tickTimer(deltaTime){
        if(gameState.isPaused||gameState.isGameOver||answeredThisQuestion)return;
        elapsedTimer+=deltaTime;
        if(elapsedTimer>=1000){
          elapsedTimer=0;
          gameState.timer--;
          if(gameState.timer<=0){
            gameState.timer=0;
            answeredThisQuestion=true;
            loseLife();
            playSound('incorrect');
            answerButtons.forEach((btn,i)=>{
              if(i===gameState.currentQuestionSet[gameState.currentQuestionIndex].correctIndex){
                btn.classList.add('correct');
              }
              btn.disabled=true;
            });
            setTimeout(()=>{
              if(!gameState.isGameOver) nextQuestion();
            },1500);
          }
          updateUI();
        }
      }
      hintBtn.addEventListener('click',()=>{
        if(gameState.powerUps.hint>0&&!answeredThisQuestion&&!gameState.isPaused&&!gameState.isGameOver){
          useHint();
        }
      });
      skipBtn.addEventListener('click',()=>{
        if(gameState.powerUps.skip>0&&!answeredThisQuestion&&!gameState.isPaused&&!gameState.isGameOver){
          useSkip();
        }
      });
      function useHint(){
        gameState.powerUps.hint--;
        updatePowerUpButtons();
        playSound('powerup');
        eliminateOneWrongAnswer();
      }
      function useSkip(){
        gameState.powerUps.skip--;
        updatePowerUpButtons();
        playSound('powerup');
        nextQuestion();
      }
      function updatePowerUpButtons(){
        hintBtn.textContent='';
        const hintIcon=document.createElement('span');
        hintIcon.className='material-icons';
        hintIcon.textContent='help_outline';
        hintBtn.appendChild(hintIcon);
        hintBtn.appendChild(document.createTextNode(` Hint (${gameState.powerUps.hint})`));
        hintBtn.disabled=gameState.powerUps.hint<=0;
        skipBtn.textContent='';
        const skipIcon=document.createElement('span');
        skipIcon.className='material-icons';
        skipIcon.textContent='skip_next';
        skipBtn.appendChild(skipIcon);
        skipBtn.appendChild(document.createTextNode(` Skip (${gameState.powerUps.skip})`));
        skipBtn.disabled=gameState.powerUps.skip<=0;
      }
      function eliminateOneWrongAnswer(){
        const question=gameState.currentQuestionSet[gameState.currentQuestionIndex];
        if(!question)return;
        const wrongIndices=[];
        for(let i=0;i<question.answers.length;i++){
          if(i!==question.correctIndex&&!answerButtons[i].disabled){
            wrongIndices.push(i);
          }
        }
        if(wrongIndices.length===0) return;
        const randomIndex=wrongIndices[Math.floor(Math.random()*wrongIndices.length)];
        const btn=answerButtons[randomIndex];
        btn.disabled=true;
        btn.classList.add('incorrect');
      }
      pauseBtn.addEventListener('click',()=>{
        if(gameState.isGameOver)return;
        if(gameState.isPaused) resumeGame();
        else pauseGame();
      });
      function pauseGame(){
        gameState.isPaused=true;
        pauseBtn.textContent='';
        const playIcon=document.createElement('span');
        playIcon.className='material-icons';
        playIcon.textContent='play_arrow';
        pauseBtn.appendChild(playIcon);
        pauseBtn.appendChild(document.createTextNode(' Resume'));
        pauseModal.classList.add('show');
        pauseModal.setAttribute('aria-hidden','false');
      }
      function resumeGame(){
        gameState.isPaused=false;
        pauseBtn.textContent='';
        const pauseIcon=document.createElement('span');
        pauseIcon.className='material-icons';
        pauseIcon.textContent='pause_circle_filled';
        pauseBtn.appendChild(pauseIcon);
        pauseBtn.appendChild(document.createTextNode(' Pause'));
        pauseModal.classList.remove('show');
        pauseModal.setAttribute('aria-hidden','true');
      }
      resumeBtn.addEventListener('click',resumeGame);
      toggleSidebarBtn.addEventListener('click',()=>{
        sidebarCollapsed=!sidebarCollapsed;
        if(sidebarCollapsed){
          sidebarEl.style.display='none';
          toggleSidebarBtn.textContent='Expand Sidebar';
          toggleSidebarBtn.setAttribute('aria-expanded','false');
        }else{
          sidebarEl.style.display='flex';
          toggleSidebarBtn.textContent='Collapse Sidebar';
          toggleSidebarBtn.setAttribute('aria-expanded','true');
        }
      });
      function triggerGameOver(){
        gameState.isGameOver=true;
        gameOverModal.setAttribute('aria-hidden','false');
        gameOverModal.classList.add('show');
        finalScoreText.textContent=`Your final score: ${gameState.score}`;
        finalLevelText.textContent=`You reached level ${gameState.level}`;
        updateHighScores();
        renderHighScores();
        pauseBtn.disabled=true;
        hintBtn.disabled=true;
        skipBtn.disabled=true;
        saveAchievements();
      }
      restartBtn.addEventListener('click',()=>{
        resetGame();
        gameOverModal.setAttribute('aria-hidden','true');
        gameOverModal.classList.remove('show');
      });
      function resetGame(){
        gameState.level=1;
        gameState.score=0;
        gameState.lives=3;
        gameState.combo=0;
        gameState.isGameOver=false;
        gameState.isPaused=false;
        gameState.powerUps.hint=3;
        gameState.powerUps.skip=2;
        gameState.currentQuestionSet=loadLevelQuestions(gameState.level);
        gameState.currentQuestionIndex=0;
        gameState.timer=MAX_TIMER;
        updatePowerUpButtons();
        updateUI();
        renderQuestion();
        pauseBtn.disabled=false;
        hintBtn.disabled=false;
        skipBtn.disabled=false;
      }
      function unlockAchievement(id){
        const achievement=gameState.achievements.find(a=>a.id===id);
        if(achievement&&!achievement.unlocked){
          achievement.unlocked=true;
          gameState.score+=achievement.reward;
          showAchievementPopup(achievement.name);
          updateUI();
          saveAchievements();
          renderAchievements();
          playSound('achievement');
        }
      }
      function checkAchievements(eventType){
        if(eventType==='correct'){
          const correctCount=gameState.combo;
          if(correctCount===1) unlockAchievement('firstCorrect');
          if(correctCount===5) unlockAchievement('fiveCorrect');
        }
      }
      function showAchievementPopup(message){
        achievementMessageEl.textContent=message;
        achievementPopupEl.classList.add('show');
        achievementPopupEl.setAttribute('aria-hidden','false');
        setTimeout(()=>{
          achievementPopupEl.classList.remove('show');
          achievementPopupEl.setAttribute('aria-hidden','true');
        },3000);
      }
      function saveAchievements(){
        localStorage.setItem('quizAchievements',JSON.stringify(gameState.achievements));
      }
      function renderAchievements(){
        achievementListEl.innerHTML='';
        gameState.achievements.forEach(a=>{
          if(a.unlocked){
            const li=document.createElement('li');
            li.innerHTML=`<span class="material-icons icon" aria-hidden="true">${a.icon}</span>${a.name}: ${a.description}`;
            achievementListEl.appendChild(li);
          }
        });
      }
      function updateHighScores(){
        gameState.highScores.push({
          name: 'Player',
          score: gameState.score,
          level: gameState.level,
          date: new Date().toISOString(),
          achievements: gameState.achievements.filter(a=>a.unlocked).map(a=>a.name),
        });
        gameState.highScores.sort((a,b)=>b.score-a.score);
        gameState.highScores=gameState.highScores.slice(0,10);
        localStorage.setItem('quizHighScores',JSON.stringify(gameState.highScores));
      }
      function renderHighScores(){
        console.log('High Scores:',gameState.highScores);
      }
      function createParticleEffect(x,y){
        const count=15;
        for(let i=0;i<count;i++){
          const particle=document.createElement('div');
          particle.classList.add('particle');
          particle.style.width=particle.style.height=`${Math.random()*8+6}px`;
          particle.style.left=`${x}px`;
          particle.style.top=`${y}px`;
          particleContainer.appendChild(particle);
          const angle=Math.random()*2*Math.PI;
          const radius=Math.random()*80+40;
          let start=null;
          function animate(time){
            if(!start)start=time;
            const elapsed=time-start;
            const progress=elapsed/600;
            if(progress<1){
              const dx=Math.cos(angle)*radius*progress;
              const dy=Math.sin(angle)*radius*progress;
              particle.style.transform=`translate(${dx}px, ${dy}px)`;
              particle.style.opacity=`${1-progress}`;
              requestAnimationFrame(animate);
            }else{
              particle.remove();
            }
          }
          requestAnimationFrame(animate);
        }
      }
      function gameLoop(timestamp){
        if(!lastFrameTime)lastFrameTime=timestamp;
        const deltaTime=timestamp-lastFrameTime;
        lastFrameTime=timestamp;
        if(!gameState.isPaused&&!gameState.isGameOver){
          tickTimer(deltaTime);
        }
        requestAnimationFrame(gameLoop);
      }
      window.addEventListener('keydown',event=>{
        if(gameState.isPaused)return;
        if(gameState.isGameOver)return;
        if(event.key==='Enter'){
          if(gameState.selectedAnswer!==null&&!answeredThisQuestion){
            checkAnswer();
          }
        }
        if(event.key>='1'&&event.key<='9'){
          const keyNumber=parseInt(event.key,10);
          if(keyNumber<=answerButtons.length&&!answeredThisQuestion){
            selectAnswer(keyNumber-1);
          }
        }
      });
      function init(){
        gameState.currentQuestionSet=loadLevelQuestions(gameState.level);
        renderQuestion();
        updatePowerUpButtons();
        updateUI();
        renderAchievements();
        gameLoop();
      }
      window.addEventListener('load',()=>{init();});
    })();