// Global variables and settings
var dataCanvas;
var dataContext;

var guessCanvas;
var guessContext;

var targetCanvas;
var targetContext;

var sourceIMG;
var sourceData;
var selectablePixels = [];
var previousPixel1 = [-50,-50];
var previousPixel2 = [-50,-50];

var a;
var q;
var gamma;
var x0;
var y0;

var aGuess;
var qGuess;
var gammaGuess;
var x0Guess;
var y0Guess;

function getCursorPosition(canvas, event) {
    const guessCanvasRect = canvas.getBoundingClientRect();
    const guessCanvasX = Math.max(Math.min(Math.floor(1000/guessCanvasRect.width*(event.clientX - guessCanvasRect.left)),1000),0);
    const guessCanvasY = Math.max(Math.min(Math.floor(1000/guessCanvasRect.height*(event.clientY - guessCanvasRect.top)),1000),0);
	document.getElementById("x0").value = guessCanvasX;
	document.getElementById("y0").value = 1000 - guessCanvasY;
	document.getElementById("x0Range").value = guessCanvasX;
	document.getElementById("y0Range").value = 1000 - guessCanvasY;
}

function checkEnter(elem, e)
{
	if(e.keyCode === 13)
	{
		lensGuess();
	}
};

function updateParam(elem)
{
	if(elem.type.toLowerCase() == "range")
	{
		var textID = elem.id.substring(0,elem.id.length - 5);
		document.getElementById(textID).value = document.getElementById(elem.id).value;
	}
	if(elem.type.toLowerCase() == "text")
	{
		var rangeID = elem.id.concat("Range");
		document.getElementById(rangeID).value = document.getElementById(elem.id).value;
	}
	
	lensGuess();
};

function updateAllParams()
{
	elemList = ["x0","y0","a","q","gamma"];
	for (i = 0; i < elemList.length; i++)
	{
		var rangeID = elemList[i].concat("Range");
		document.getElementById(rangeID).value = document.getElementById(elemList[i]).value;
	}
}

window.onload=function()
{
	sourceIMG = document.getElementById("sourceIMG");
	dataCanvas = document.getElementById("dataCanvas");
	dataCanvas.width = sourceIMG.width;
	dataCanvas.height = sourceIMG.height;
	dataContext = dataCanvas.getContext("2d", {willReadFrequently: true});
	// dataContext.drawImage(sourceIMG,0,0);
	// sourceData = dataContext.getImageData(0,0,dataCanvas.width,dataCanvas.height);

	guessCanvas = document.getElementById("guess");
	guessContext = guessCanvas.getContext("2d", {willReadFrequently: true});
	guessContext.scale(300/1000,150/1000);
	
	guessCanvas.addEventListener(
	'mousedown',
	function(e)
	{
		getCursorPosition(guessCanvas, e)
	}
	)
	
	targetCanvas = document.getElementById("target");
	targetContext = targetCanvas.getContext("2d", {willReadFrequently: true});
	targetContext.scale(300/1000,150/1000);
	
	ellipseCheckbox = document.getElementById("ellipseCheckbox");
	ellipseCheckbox.addEventListener("click", lensGuess);
	
	scoreCheckbox = document.getElementById("scoreCheckbox");
	scoreCheckbox.addEventListener("click", scoreDisplay);
	
	paramPanel = document.getElementsByTagName("paramPanel")[0];
	revealButton = document.getElementById("revealButton");
	
	demoGame();
};

function changeImage(imgName)
{
	sourceIMG.src = imgName.concat(".png")
};

function changeLevel(level)
{
	
};

function demoGame()
{
	document.getElementById("guessLabel").innerHTML = "Source";
	
	for (const element of paramPanel.children)
	{
		element.disabled = false;
	};
	revealButton.innerHTML = "Reveal";
	revealButton.onclick = reveal;
	
	dataContext.drawImage(sourceIMG,0,0);
	sourceData = dataContext.getImageData(0,0,dataCanvas.width,dataCanvas.height);
	
	guessContext.drawImage(dataCanvas,0,0);
	
	var lensData = dataContext.createImageData(dataCanvas.width, dataCanvas.height);
	
	a = 100;
	q = 0.6;
	gamma = 45 * Math.PI / 180;
	
	if (sourceIMG.src.includes("Demo-circle.png"))
	{
		x0 = 500;
		y0 = 500;
	}
	else if (sourceIMG.src.includes("JWST01.png"))
	{
		x0 = 550;
		y0 = 300;
	}
	else if (sourceIMG.src.includes("JWST02.png"))
	{
		x0 = 170;
		y0 = 200;
	}
	else if (sourceIMG.src.includes("JWST03.png"))
	{
		x0 = 680;
		y0 = 250;
	}
	
	for (i=0; i<lensData.data.length; i+=4)
	{
		var y = Math.floor(i / (4 * dataCanvas.width));
		var x = i / 4 - y * dataCanvas.width;
		
		var pixel = getPixel(x, y, x0, y0, a, q, gamma);
		lensData.data[i+0] = pixel[0];
		lensData.data[i+1] = pixel[1];
		lensData.data[i+2] = pixel[2];
		lensData.data[i+3] = pixel[3];
	};
	
	dataContext.putImageData(lensData,0,0);
	targetContext.drawImage(dataCanvas,0,0);
};

function playGame()
{
	document.getElementById("guessLabel").innerHTML = "Source";
	
	for (const element of paramPanel.children)
	{
		element.disabled = false;
	};
	revealButton.innerHTML = "Reveal";
	revealButton.onclick = reveal;
	
	if (sourceIMG.src.includes("Demo-circle.png"))
	{
		demoGame();
		return;
	}
	
	dataContext.drawImage(sourceIMG,0,0);
	sourceData = dataContext.getImageData(0,0,dataCanvas.width,dataCanvas.height);
	
	guessContext.drawImage(dataCanvas,0,0);
	
	var lensData = dataContext.createImageData(dataCanvas.width, dataCanvas.height);
	
	var success = false;
	while(success == false)
	{
		a = Math.exp(Math.random()*Math.log(3.5) + Math.log(100));
		q = Math.random()*0.69 + 0.3;
		gamma = Math.random()*Math.PI;
		selectablePixels = [];
		for (i=0; i<sourceData.data.length; i+=4)
		{
			var y = Math.floor(i / (4 * dataCanvas.width));
			var x = i / 4 - y * dataCanvas.width;
			
			if(x >= 1.5*a && x <= 1000-3*a && y >= 1.5*a && y<=1000-3*a && Math.abs(x - previousPixel1[0]) >= 50 && Math.abs(y - previousPixel1[1]) >= 50 && Math.abs(x - previousPixel2[0]) >= 50 && Math.abs(y - previousPixel2[1]) >= 50 && sourceData.data[i+0] + sourceData.data[i+1] + sourceData.data[i+2] > 75)
			{
				selectablePixels.push([x,y]);
			};
		};
		if(selectablePixels.length > 0)
		{
			success = true;
		}
	};
	
	var centreIndex = Math.floor(Math.random()*selectablePixels.length);
	[x0,y0] = selectablePixels[centreIndex];
	previousPixel1 = previousPixel2;
	previousPixel2 = [x0,y0];
	
	// console.log([x0,y0,a,q,gamma*180/Math.PI]);
	
	for (i=0; i<lensData.data.length; i+=4)
	{
		var y = Math.floor(i / (4 * dataCanvas.width));
		var x = i / 4 - y * dataCanvas.width;
		
		var pixel = getPixel(x, y, x0, y0, a, q, gamma);
		lensData.data[i+0] = pixel[0];
		lensData.data[i+1] = pixel[1];
		lensData.data[i+2] = pixel[2];
		lensData.data[i+3] = pixel[3];
	};
	
	dataContext.putImageData(lensData,0,0);
	targetContext.drawImage(dataCanvas,0,0);
};

function lensGuess()
{	
	updateAllParams();

	document.getElementById("guessLabel").innerHTML = "Guess";
	
	var lensData = dataContext.createImageData(dataCanvas.width, dataCanvas.height);
		
	aGuess = document.getElementById("a").value * 1.0;
	qGuess = document.getElementById("q").value * 1.0;
	gammaGuess = document.getElementById("gamma").value * Math.PI / 180;
	x0Guess = document.getElementById("x0").value * 1.0;
	y0Guess = 1000 - document.getElementById("y0").value * 1.0;
	
	for (i=0; i<lensData.data.length; i+=4)
	{
		var y = Math.floor(i / (4 * dataCanvas.width));
		var x = i / 4 - y * dataCanvas.width;
		
		var pixel = getPixel(x, y, x0Guess, y0Guess, aGuess, qGuess, gammaGuess);
		lensData.data[i+0] = pixel[0];
		lensData.data[i+1] = pixel[1];
		lensData.data[i+2] = pixel[2];
		lensData.data[i+3] = pixel[3];
	};
	
	dataContext.putImageData(lensData,0,0);
	guessContext.drawImage(dataCanvas,0,0);
	
	if (ellipseCheckbox.checked)
	{
		guessContext.lineWidth = 5;
		guessContext.strokeStyle = "black";
		guessContext.setLineDash([]);
		guessContext.beginPath();
		guessContext.ellipse(x0Guess, y0Guess, aGuess, qGuess*aGuess, gammaGuess + Math.PI/2, 0, 2*Math.PI);
		guessContext.stroke();
		guessContext.strokeStyle = "white";
		guessContext.setLineDash([10, 10]);
		guessContext.beginPath();
		guessContext.ellipse(x0Guess, y0Guess, aGuess, qGuess*aGuess, gammaGuess + Math.PI/2, 0, 2*Math.PI);
		guessContext.stroke();
	}
};

function getPixel(x, y, x0, y0, a, q, gamma)
{
	if (q == 0)
	{
		q = 0.01;
	};
	if (q == 1)
	{
		q = 0.99;
	};
	var q2 = Math.sqrt(1 - q * q);
	var xr = (x - x0) * Math.cos(gamma) + (y - y0) * Math.sin(gamma);
	var yr = -(x - x0) * Math.sin(gamma) + (y - y0) * Math.cos(gamma);
	
	var phi = Math.atan2(yr,xr);
	var da = -a * q / q2 * Math.asinh(q2 / q * Math.cos(phi));
	var db = -a * q / q2 * Math.asin(q2 * Math.sin(phi));
	
	var dx = da * Math.cos(gamma) - db * Math.sin(gamma);
	var dy = da * Math.sin(gamma) + db * Math.cos(gamma);
	
	var xSource = Math.round(x + dx);
	var ySource = Math.round(y + dy);
	
	if(xSource < 0 || xSource > 1000 || ySource < 0 || ySource > 1000)
	{
		return [Math.floor(Math.random()*7 + 16),Math.floor(Math.random()*7 + 16),Math.floor(Math.random()*7 + 16),255];
	}
	else
	{
		var sourceIndex = (ySource * dataCanvas.width + xSource) * 4;
		return [sourceData.data[sourceIndex+0],sourceData.data[sourceIndex+1],sourceData.data[sourceIndex+2],sourceData.data[sourceIndex+3]];
		
	};
};

function unLens()
{
	document.getElementById("guessLabel").innerHTML = "Source";
	dataContext.drawImage(sourceIMG,0,0);
	guessContext.drawImage(dataCanvas,0,0);
};

function reveal()
{	
	guessContext.lineWidth = 5;
	guessContext.strokeStyle = "red";
	guessContext.setLineDash([]);
	guessContext.beginPath();
	guessContext.ellipse(x0, y0, a, q*a, gamma + Math.PI/2, 0, 2*Math.PI);
	guessContext.stroke();
	targetContext.lineWidth = 5;
	targetContext.strokeStyle = "red";
	targetContext.setLineDash([]);
	targetContext.beginPath();
	targetContext.ellipse(x0, y0, a, q*a, gamma + Math.PI/2, 0, 2*Math.PI);
	targetContext.stroke();
	
	guessContext.lineWidth = 5;
	guessContext.strokeStyle = "black";
	guessContext.setLineDash([]);
	guessContext.beginPath();
	guessContext.ellipse(x0Guess, y0Guess, aGuess, qGuess*aGuess, gammaGuess + Math.PI/2, 0, 2*Math.PI);
	guessContext.stroke();
	guessContext.strokeStyle = "white";
	guessContext.setLineDash([10, 10]);
	guessContext.stroke();
	targetContext.lineWidth = 5;
	targetContext.strokeStyle = "black";
	targetContext.setLineDash([]);
	targetContext.beginPath();
	targetContext.ellipse(x0Guess, y0Guess, aGuess, qGuess*aGuess, gammaGuess + Math.PI/2, 0, 2*Math.PI);
	targetContext.stroke();
	targetContext.strokeStyle = "white";
	targetContext.setLineDash([10, 10]);
	targetContext.stroke();
	
	for (const element of paramPanel.children)
	{
		element.disabled = true;
	};
	
	revealButton.innerHTML = "Next image";
	revealButton.onclick = playGame;
	revealButton.disabled = false;
	
	score()
};

function score()
{
	
	areaGuess = Math.PI * aGuess ** 2 * qGuess;
	areaTrue = Math.PI * a ** 2 * q;
	
	targetContext.beginPath();
	targetContext.ellipse(x0, y0, a, q*a, gamma + Math.PI/2, 0, 2*Math.PI);
	guessContext.beginPath();
	guessContext.ellipse(x0Guess, y0Guess, aGuess, qGuess*aGuess, gammaGuess + Math.PI/2, 0, 2*Math.PI);
	
	sharedCount = 0;
	for (xArea = 0; xArea < 1000; xArea ++)
	{
		for (yArea = 0; yArea < 1000; yArea ++)
		{
			if (targetContext.isPointInPath(xArea*300/1000,yArea*150/1000) && guessContext.isPointInPath(xArea*300/1000,yArea*150/1000))
			{
				sharedCount += 1;
			}
		}
	}
	console.log(sharedCount);
	console.log(areaTrue);
	console.log(areaGuess);
	console.log(Math.trunc(sharedCount / Math.max(areaTrue, areaGuess) * 100));
};

function scoreDisplay()
{
	scores = document.getElementById("scores");
	if (ellipseCheckbox.checked)
	{
		scores.style.visibility = 'visible';
	}
	else
	{
		scores.style.visibility = 'hidden';
	}
};