// JavaScript Document
HOST = 'http://weiqi-gadget.googlecode.com/svn/trunk/';
SQUARE_SIZE = 20;
CURSOR_BORDER = 2;

EMPTY_SPACE = 0;

GAME_SIZE = 19;

COLOR = {
	'white': 1,
	'black': 2
};

board = null;
playerId = undefined;
opponentId = undefined;
justSelectColor=false;
lang="en";

gameState = {
	board: null,
	lang: null,
	moveHistory: "",
	current: COLOR.black,
	last: null,
	winner: -1,
	black: undefined,
	white: undefined,
	whiteName: undefined,
	blackName: undefined
};

navState = {
	bShowNav: false,
	showIndex: 0,
	backupHistory: ""
};

window.$ = function(id) {
	return document.getElementById(id);
};

function changeLang(lang)
{
   var e = $("LangJS");
   var h=document.getElementsByTagName("head");
   h[0].removeChild(e);
   e.src = "lang."+lang+".js";
   h[0].appendChild(e);
}

function showElement(name) {
	$(name).className = '';
}

function hideElement(name) {
	$(name).className = 'hide';
}

function clearChildren(el) {
	while (el.firstChild) {
	  el.removeChild(el.firstChild);
	}
}

function Pos(row, col) {
	this.row = row;
	this.col = col;
}

function recordMove(ch,coords) {
	var sgf = (ch==COLOR.white?"W":"B");
	sgf += "["+String.fromCharCode(97+coords.row,97+coords.col)+"];";
	gameState.moveHistory += sgf;
}

function isMyTurn() {
	return !self.gameOver && gameState.current == getMyColor();
}

function newPos(x, y) {
	return {'x': x, 'y': y};
}

function newCoords(row, col) {
	return {'row' : row, 'col': col};
}

function coordsToPos(coords) {
	var x = SQUARE_SIZE * coords.col+SQUARE_SIZE/2;
	var y = SQUARE_SIZE * coords.row+SQUARE_SIZE/2;
	return newPos(x, y);
}

function posToCoords(pos) {
	boardPos = getElementPos(board.root);
	var y = (pos.y - boardPos.y - SQUARE_SIZE/2) / SQUARE_SIZE;
	var x = (pos.x - boardPos.x - SQUARE_SIZE/2) / SQUARE_SIZE;
	y = Math.floor(y);
	x = Math.floor(x);
	return newCoords(y, x);
}

function coordsValid(c) {
	return c.col >= 0 && c.col < GAME_SIZE &&
	       c.row >= 0 && c.row < GAME_SIZE;
}

function coordsEqual(a, b) {
	if (a && b) {
	  return a.row == b.row && a.col == b.col;
	}
	return false;
}

function setPos(el, pos) {
	el.style.left = pos.x + 'px';
	el.style.top = pos.y + 'px';
}

function codeToImage(code) {
	var img = document.createElement('img');
	img.src = HOST  + (code == COLOR.white ? 'w' : 'b')+'.png';
	img.className = 'piece';
	return img;
}

function getOtherColor(color) {
	return color == COLOR.white ? COLOR.black : COLOR.white;
}

function getElementPos(el) {
	var x = 0;
	var y = 0;
	if (el.offsetParent) {
	  do {
	    x += el.offsetLeft;
	    y += el.offsetTop;
	  } while (el = el.offsetParent);
	}
	return newPos(x, y);
}

function getMousePos(e) {
	var x = 0;
	var y = 0;
	if (!e) {
	  e = window.event;
	}
	if (e.pageX || e.pageY) {
		x = e.pageX;
		y = e.pageY;
	}
	else if (e.clientX || e.clientY) {
		x = e.clientX + document.body.scrollLeft
			  + document.documentElement.scrollLeft;
		y = e.clientY + document.body.scrollTop
			  + document.documentElement.scrollTop;
	}
	return newPos(x, y)
}

function changePointer(type) {
	document.body.style.cursor = type;
}

function setInfo(msg) {
	$('info').innerHTML = msg;
}

function showSGF(msg) {
	$('sgf').innerHTML = msg;
}

function selectColor(color) {
	if (color == COLOR.black) {
	  gameState.black = playerId;
	  gameState.white = opponentId;
	} else {
	  gameState.black = opponentId;
	  gameState.white = playerId;
	}
	justSelectColor=true;
	updateGameState();
}

function getMyColor() {
	return gameState.black == playerId ? COLOR.black : COLOR.white;
}

function getOpponentColor() {
	return gameState.black == playerId ? COLOR.white : COLOR.black;
}

function Board() {
	var self = this;
	this.root = $('board');
	clearChildren(this.root);

	this.state=new Array(GAME_SIZE);
	for (var i=0;i <GAME_SIZE; i++) {
		this.state[i]=new Array(GAME_SIZE);
		for (var j=0; j< GAME_SIZE; j++) {
			this.state[i][j]=EMPTY_SPACE;
		}
	}
	this.gameOver = false;
}

Board.onClick = function(e) {
	if (!board) {
	  return;
	}
	if (!isMyTurn()) {
	  return;
	}
	if (justSelectColor) {
		justSelectColor=false;
	  	return;
	}
	var pos = getMousePos(e);
	coords = posToCoords(pos);
	if (!board.isValidMove(coords)) return;

	board.putAStone(coords);
	};

	Board.prototype.putAStone = function(coords) {
	var ch=getMyColor();

	this.putAStoneOnBoard(coords,ch);

	this.render();
	this.endTurn();
};

Board.prototype.putAStoneOnBoard = function(coords,ch) {
	this.state[coords.row][coords.col]=ch;
	recordMove(ch,coords);
	gameState.last = coords;
	this.checkCapture(ch);
};

Board.prototype.checkCapture = function(ch) {
	this.checkCaptureColor(getOtherColor(ch));
	this.checkCaptureColor(ch);
};

Board.prototype.checkCaptureColor = function(ch) {
	var groupList=[];
	//group opponent
	for (var i=0;i <GAME_SIZE; i++) {
		for (var j=0; j< GAME_SIZE; j++) {
			if (this.state[i][j]==ch) {
				var ofGroup=false;
				var inGroup=null;

				for (tG in groupList) {
					var tGroup=groupList[tG];
					if (tGroup.length==0) continue;
					for (tC in tGroup) {
						if ( i-1>=0 && tGroup[tC] == (i-1)*GAME_SIZE+j
							|| i+1<GAME_SIZE && tGroup[tC] == (i+1)*GAME_SIZE+j
							|| j+1<GAME_SIZE && tGroup[tC] == i*GAME_SIZE+j+1
							|| j-1>=0 && tGroup[tC] == i*GAME_SIZE+j-1) {
							ofGroup=true;
							if (inGroup==null) {
								inGroup=tG;
								groupList[inGroup].push(i*GAME_SIZE+j);
							} else {
								groupList[inGroup]=groupList[inGroup].concat(tGroup);
								groupList[tG]=[];
							}
							break;
						}
					}
				}
				if (!ofGroup) {
					var newGroup=[];
					newGroup.push(i*GAME_SIZE+j);
					groupList.push(newGroup);
				}
			}
		}
	}
	//group air and capture
	for (tG in groupList) {
		var bAir=false;
		var tGroup=groupList[tG];
		if (tGroup.length==0) continue;
		for (tC in tGroup) {
			if (this.haveAir(tGroup[tC])) {
				bAir=true;
				break;
			}
		}
		if (!bAir) {
			for (tC in tGroup) {
				this.state[Math.floor(tGroup[tC]/GAME_SIZE)][tGroup[tC] % GAME_SIZE]=EMPTY_SPACE;
			}
		}
	}
};

Board.prototype.haveAir = function(xy) {
	var row=Math.floor(xy/GAME_SIZE);
	var col=xy % GAME_SIZE;
	//up
	if (row-1 >= 0) {
		if (this.state[row-1][col] == EMPTY_SPACE) return true;
	}
	//down
	if (row+1 < GAME_SIZE) {
		if (this.state[row+1][col] == EMPTY_SPACE) return true;
	}
	//left
	if (col-1 >= 0) {
		if (this.state[row][col-1] == EMPTY_SPACE) return true;
	}
	//right
	if (col+1 < GAME_SIZE) {
		if (this.state[row][col+1] == EMPTY_SPACE) return true;
	}
	return false;
};

Board.onMouseMove = function(e) {
	if (!board) {
	  return;
	}
	if (!isMyTurn()) {
	  return false;
	}

	var pos = getMousePos(e);
	var coords = posToCoords(pos);
	if (board.isValidMove(coords)) {
		changePointer("pointer");
	} else {
		changePointer("default");
	}
};

Board.onMouseOut = function(e) {
	changePointer('default');
};

Board.prototype.setState = function(state) {
	this.state = JSON.parse(state);
}

Board.prototype.isValidMove = function(coords) {
	if (coords.row<0 || coords.col<0 || coords.row>GAME_SIZE-1 || coords.col>GAME_SIZE-1) return false;
	if (board.state[coords.row][coords.col] != EMPTY_SPACE) return false;
	return true;
};

Board.prototype.endTurn = function() {
	gameState.current = getOtherColor(gameState.current);
	updateGameState();
};

Board.prototype.clearBoard = function() {
	$('void').appendChild($('selectColor'));
	$('void').appendChild($('cursor'));
	clearChildren(this.root);
}

Board.prototype.render = function() {
	this.clearBoard();

    for (var i = 0; i < GAME_SIZE; ++i) {
		for (var j = 0; j < GAME_SIZE; ++j) {
			var ch = this.state[i][j];
			if (ch == EMPTY_SPACE) {
				continue;
			}
			var img = codeToImage(ch);
			var coords = newCoords(i, j);
			setPos(img, coordsToPos(coords));
			this.root.appendChild(img);
            var index=(gameState.moveHistory.lastIndexOf(String.fromCharCode(97+i,97+j))+4)/6;
			img.title=index;
		}
    }

	if (!gameState.black) {
		if (opponentId)
			this.root.appendChild($('selectColor'));
		hideElement('resign');
	} else {
		showElement('resign');
	}

	var msg = '';
	if (gameState.winner != -1) {
		msg = gameState.winner == COLOR.white ? 'White' : 'Black';
		msg += ' wins!';
		hideElement('resign');
		showElement('rematch');
	} else {
		if (gameState.current == COLOR.white) {
			msg = 'White to Move';
		} else {
			msg = 'Black to Move';
		}
		hideElement('rematch');
	}
	setInfo(msg);

	// Show sgf
	showSGF(gameState.moveHistory);

	if (gameState.last) {
		var cursor = $("cursor");
		cursor.className = 'cursor';
		setPos(cursor, coordsToPos(gameState.last));
        this.root.appendChild(cursor);
		//alert("add cursor "+gameState.last.row+","+gamestate.last.col);
	}
};

function resign() {
	var myID=wave.getViewer().getId();
	if (myID != gameState.black && myID != gameState.white) {
		return;
	}
	gameState.winner = getOpponentColor();
	updateGameState();
}

function leave() {
	var myID=wave.getViewer().getId();
	if (myID == gameState.black) {
	    gameState.black = undefined;
		gameState.blackName = undefined;
	} else if (myID == gameState.white) {
		gameState.white = undefined;
		gameState.whiteName = undefined;
	} else {
		return;
	}
	updateGameState();
}

  function rematch() {
	var myID=wave.getViewer().getId();
	if (myID != gameState.black && myID != gameState.white) {
		return;
	}
    resetGame();
    updateGameState();
}

function replay() {
	var myID=wave.getViewer().getId();
	if (myID != gameState.black && myID != gameState.white) {
		return;
	}
	for (var i=0;i <GAME_SIZE; i++) {
		for (var j=0; j< GAME_SIZE; j++) {
			board.state[i][j]=EMPTY_SPACE;
		}
	}

	var sgf=$('sgf').value;
    gameState.moveHistory="";
	var index=sgf.indexOf("B");
	sgf=sgf.substring(index);
	//alert(sgf);
	var last;
	for (var i=0;i<sgf.length/6;i++) {
		var stone=sgf.slice(i*6,i*6+6);     //B[bc];
		//alert(stone);
		if(stone.charAt(0)=='B') ch=COLOR.black;
		else ch=COLOR.white;
        var coords = newCoords(stone.charCodeAt(2)-97,stone.charCodeAt(3)-97);
		//alert("put at x:"+coords.row+" y:"+coords.col+" color:"+ch);
        board.putAStoneOnBoard(coords,ch);
		last=ch;
	}
	board.render();
    gameState.current = getOtherColor(last);
    updateGameState();
}

function nav(offer) {
	if (!navState.bShowNav) {
  		navState.bShowNav=true;
		navState.backupHistory=gameState.moveHistory;
		navState.showIndex=navState.backupHistory.length/6;
	}

	switch(offer) {
		case "begin":
			navState.showIndex=0;
			break;
		case "pre":
			navState.showIndex--;
			if (navState.showIndex<0) navState.showIndex=0;
			return;
		case "next":
			navState.showIndex++;
			if (navState.showIndex>=navState.backupHistory.length/6) navState.showIndex=navState.backupHistory.length/6;
			break;
		case "end":
        	navState.showIndex=navState.backupHistory.length/6;
			break;
	}

	if (navState.showIndex==navState.backupHistory.length/6) {
  		navState.bShowNav=false;
		gameState.moveHistory=navState.backupHistory;
		return;
	}

	var sgf=navState.backupHistory;
	var index=sgf.indexOf("B");
	sgf=sgf.substring(index);
	for (var i=0;i <GAME_SIZE; i++) {
		for (var j=0; j< GAME_SIZE; j++) {
			board.state[i][j]=EMPTY_SPACE;
		}
	}
	for (var i=0;i<navState.showIndex;i++) {
		var stone=sgf.slice(i*6,i*6+6);     //B[bc];
		//alert(stone);
		if(stone.charAt(0)=='B') ch=COLOR.black;
		else ch=COLOR.white;
	    var coords = newCoords(stone.charCodeAt(2)-97,stone.charCodeAt(3)-97);
		//alert("put at x:"+coords.row+" y:"+coords.col+" color:"+ch);
	    board.putAStoneOnBoard(coords,ch);
		last=ch;
	}
	board.render();
}

function resetGame() {
    gameState.current = COLOR.black;
    gameState.moveHistory = "";
    gameState.winner = -1;
    gameState.last = "";
    gameState.black = "";
    gameState.white = "";
    gameState.blackName = "";
    gameState.whiteName = "";
    board = new Board();
    board.render();
}

function onLanguageChange(selectedLang) {
	lang= selectedLang;
}

function setGameTitle() {
    $('blackname').innerHTML = gameState.blackName;
    $('whitename').innerHTML = gameState.whiteName;
}

function getPlayerName(pid) {
	var parts = wave.getParticipants();
	for(var i=0;i<parts.length;i++){
		var id = parts[i].getId();
		if (id==pid){
			return parts[i].getDisplayName();
		}
	}
	return " ";
}

function onStateChange(state) {
	if (!state) {
		return;
	}

	if (!board)
		return;

	if (!playerId) {
		playerId = wave.getViewer().getId();
	}

	var tempState = JSON.parse(state.get('gameState','{}'));
	if (tempState && tempState.board){
		if (!opponentId && tempState.white && tempState.black){
			opponentId = playerId==tempState.white?tempState.black:tempState.white;
		}
		gameState = tempState;
		board.setState(gameState.board);
        setGameTitle();
		board.render();
	}
}

function onParticipantsChange() {
	if (opponentId||gameState.black)
		return;

	var parts = wave.getParticipants();
	if (parts.length>1){
		if (!playerId)  {
			playerId = wave.getViewer().getId();
		}
		for(var i=0;i<parts.length;i++){
			var id = parts[i].getId();
			if (id!=playerId){
				opponentId = id;
				resetGame();
				updateGameState();
				return;
			}
		}
	}
}

function updateGameState() {
	gameState.board = JSON.stringify(board.state);
	gameState.blackName=getPlayerName(gameState.black);
    gameState.whiteName=getPlayerName(gameState.white);
	wave.getState().submitDelta({gameState:JSON.stringify(gameState)});
}
