//Primeiro passo definição de variáveis
var tamPopulation = 350
var tamGerations = 100
var tamGenes = 8
var genes = []
var reproduction = 65
var qtdIndMut = tamPopulation * mutation / 100
var qtdIndRep = tamPopulation * reproduction / 100
var mutation = 35
var perMutation = 0.21
var CritStop = 100
var sumScore = 0
var batimetria = require('users/jfelipecarvalho1/batimetria:batimetria');
//Segundo passo inicio da população
var population = [];
//print(getRandomArbitrary(1,2))

function iniciar(){
	geraPopulacao();
	var numGerations = 1
	//faz o algoritmo rodar por tempo indeterminado
	while(numGerations < tamGerations){
		//passa por cada indivíduo e aplica nas imagens para obter a pontuação de cada um
		for(var i = 0; i < tamPopulation; i++)
		{
			var score = 0
			score = batimetria.startBatimetria(population[i].gene)
			//print(population[i].gene)
			//print(score)
			var ind = population[i] 
			ind.score = score
			sumScore += score
			population[i] = ind
			print(i)
		}
		sleep(100)
		gerNewPopulation();
		numGerations++
		print(numGerations)
	}		
	
	for(var k = 0; k < tamPopulation; k++){
	  print(population[k].score)
	}
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
function geraPopulacao(){
	for(var i = 0; i < tamPopulation; i++)
	{
		for(var j = 0; j < tamGenes; j++)
		{	
			genes[j] = getRandomArbitrary(0, 1) 
		}
		var individuo = {
			gene		: 	genes,
			score		:	0
		}
		population.push(individuo)
		genes = []
	}

}

function onePointCros(aPais){
	var aFilhos = []
	
	var point = getRandomArbitrary(2, 6) 
	
	var rightGene1 =  aPais[0].slice(0, point)
	var leftGene1 = aPais[0].slice(point, 8 )
	var rightGene2 =  aPais[1].slice(point, 8 )
	var leftGene2 = aPais[1].slice(0, point )
	
	var individuo1 = {
			gene		: 	rightGene1.concat(leftGene1),
			score		:	0
	}
	var individuo2 = {
			gene		: 	rightGene2.concat(leftGene2),
			score		:	0
	}
	aFilhos.push(individuo1)
	aFilhos.push(individuo2)
	return aFilhos
}

function crosAritm(aPais){
	var aFilhos = []	
	var point = getRandomArbitrary(0, 1)
	var genes1 = []
	var genes2 = []
	
	for(var i = 0; i < 8; i++){
		genes1.push((aPais[0].gene[i]*point)+(aPais[1].gene[i]*(1-point)))
		genes2.push((aPais[0].gene[i]*(1-point))+(aPais[1].gene[i]*point))
	}
	
	var individuo1 = {
			gene		: 	genes1,
			score		:	0
	}
	var individuo2 = {
			gene		: 	genes2,
			score		:	0
	}
	aFilhos.push(individuo1)
	aFilhos.push(individuo2)
	return aFilhos
}



function gerNewPopulation(){
	var newPopulation = []
	var qtdMut = 0
	var qtdRep = 0
	var aPais = []
	newPopulation.push(population[0])
	newPopulation.push(population[1])
	while(ee.List(newPopulation).size() < tamPopulation){		
		var ran = getRandomArbitrary(0, 1) 
		if (ran < 0.5){
			aPais = selecaoRoleta()
		}
		else{
			aPais = selecaoTorneio()
		}
		ran = getRandomArbitrary(0, 1)
		if(ran < 0.5 && qtdMut < qtdIndMut){			
			var aMutados = fazerMutacao(aPais)
			population.push(aMutados[0])
			population.push(aMutados[1])
			qtdMut+=2
		}
		else{
			var aFilhos = crossover(aPais)
			for(var k = 0; k < len(aFilhos); k++){
				population.push(aFilhos[k])
			}
			qtdRep+=len(aFilhos)
		}
		shuffleArray()
	}
	population = newPopulation
}

function shuffleArray(){
    population.sort(Math.random() - 0.5);
}

function selecaoTorneio(){
	var rightSide = population.slice(1, tamPopulation/2)
	var leftSide = population.slice(tamPopulation/2, tamPopulation)
	var cont = 0
	var pivo1 = 0 
	var pivo2 = 0
	
	while(ee.List(rightSide).size() != 1){
	  print('rightSide',rightSide[cont])
		if (rightSide[cont].score < rightSide[cont+1].score){
			rightSide.splice(cont+1,1)
		}else{
			rightSide.splice(cont,1)
		}
		if(cont >= ee.List(rightSide).size()){
			cont = 0
		}else{
			cont++
		}		
	}
	
	while(ee.List(leftSide).size() != 1){
		if (leftSide[cont].score < leftSide[cont+1].score){
			leftSide.splice(cont+1,1)
		}else{
			leftSide.splice(cont,1)
		}
		if(cont >= ee.List(leftSide).size()){
			cont = 0
		}else{
			cont++
		}		
	}
	
	return [leftSide[0], rightSide[0]]	
}


function selecaoRoleta(){
	//orderna a população pelo score
	var roleta = [tamPopulation*sumScore]
	var qtdPosicoes = 0
	for(var i = 0; i < tamPopulation*sumScore; i++){
	  roleta[i] = -1
	}
	population.sort(function (a, b) {
	  if(a.score < b.score){ 
	    return 1;
	  }
	  if(a.score > b.score){
		  return -1;
	  }
	  // a must be equal to b
	  return 0;
	});
	var sum = 0;
	for(var i = 0; i < tamPopulation; i++){
		var perPos = population[i].score/sumScore;
		qtdPosicoes = ee.Number(ee.List(roleta).size() * perPos);
		for(var j = 0; j <  qtdPosicoes; j++){
			var ran = getRandomArbitrary(0, len(roleta)-1) 
			while (roleta[ran] != -1){
				ran = getRandomArbitrary(0, ee.List(roleta).size()-1) 
			}
			roleta[ran] = population[i].score
		}
	}
	var valPai1 = getRandomArbitrary(0, ee.List(roleta).size()-1)
	var scorePai1 = roleta[valPai1]
	
	var valPai2 = getRandomArbitrary(0, ee.List(roleta).size()-1)
	var scorePai2 = roleta[valPai2]
	while (scorePai1 == scorePai1){
		valPai2 = getRandomArbitrary(0, ee.List(roleta).size()-1)
		scorePai2 = roleta[valPai2]
	}
	var aPais = []
	for(var i = 0; i < tamPopulation; i++){
		if(population[i].score == valPai1){
			aPais.push(population[i])
		}
		else if(population[i].score == valPai2){
			aPais.push(population[i])
		}
	}
	return aPais
}

function crossover(aPais){
	var aFilhos = []
			
	var ran = getRandomArbitrary(0, 1) 
	if (ran < 0.5){
		aFilhos = onePointCros(aPais)
	}
	else{
		aFilhos = crosAritm(aPais)
	}
	return aFilhos
}

function fazerMutacao(aPais){
	var gene = []
	var aMutados = []
	var indiv = {}
	
	var ran = getRandomArbitrary(0, 8) 
	indiv = aPais[0]
	indiv.gene[ran] = indiv.gene[ran] * 0.21
	aMutados.push(indiv)
	
	ran = getRandomArbitrary(0, 8) 
	indiv = aPais[1]
	indiv.gene[ran] = indiv.gene[ran] * 0.21
	aMutados.push(indiv)
	return aMutados
}

iniciar()
// Terceiro Passo 
