//Primeiro passo definição de variáveis
var tamPopulation = 350
var tamGerations = 100
var tamGenes = 8
var genes = []
var reproduction = 65
var mutation = 35
var perMutation = 0.21
var CritStop = 100
var lodash = require('lodash');

//Segundo passo inicio da população
var population = []

async function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
function geraPopulacao(){
	for(var i = 0; i < tamPopulation; i++)
	{
		for(var j = 0; j < tamGenes; j++)
		{	
			genes[j] = getRandomArbitrary(0, 1) 
		}
		individuo = {
			gene		: 	genes,
			score		:	0
		}
		population.push(individuo)
	}

}


async function iniciar(){
	geraPopulacao();
	//faz o algoritmo rodar por tempo indeterminado
	while(true){
		//passa por cada indivíduo e aplica nas imagens para obter a pontuação de cada um
		for(var i = 0; i < tamPopulation; i++)
		{
			var score = 0
			score = aplicaImagens(population[i])
			ind = population[i]
			ind.score = score
			population[i] = ind
		}
		await(selecao());
		await(crossover());
		if(Math.random <= (mutation/100)){
			await(fazerMutacao());
		}
	}					
}


function selecao(){
	//orderna a população pelo score
	population.sort(function (a, b) {
	  if (a.score > b.score) {
		return 1;
	  }
	  if (a.score < b.score) {
		return -1;
	  }
	  // a must be equal to b
	  return 0;
	});
	var sum = 0
	for(var i = 0; i < tamPopulation; i++){
		sum += population[i].score
	}
	
}

function crossover(){
	var aFilhos = []
	var newPopulation = []
	for (var i = 0. i < tamPopulation; i++){
		aFilhos = []
		var ran = getRandomArbitrary(0, 1) 
		if (ran < 0.5){
			aPais = selecaoRoleta()
		}
		else{
			aPais = selecaoTorneio()
		}		
		ran = getRandomArbitrary(0, 1) 
		if (ran < 0.5){
			aFilhos = onePointCros(aPais)
		}
		else{
			aFilhos = crosAritm(aPais)
		}
		for(var j = 0; j< len(aFilhos); j++){
			newPopulation.push(aFilhos[j])
		}		
	}
}

function fazerMutacao(){
	
}

function fazerMutacao(individuo){
	
}

// Terceiro Passo 
