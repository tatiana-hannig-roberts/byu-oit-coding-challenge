import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

import { shuffle } from 'lodash';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})

export class AppComponent {
	constructor(private http: HttpClient) { }
	word = '';
	letters = [];
	chosenLetters = [];
	submittedValidWords = [];
	submittedInvalidWords = [];
	buttonsDisabled = false;
	boardDisabled = false;
	difficultyOptions = [
	  { name: 'Easy', minLength: 0, maxLength: 5 },
	  { name: 'Medium', minLength: 6, maxLength: 7 },
	  { name: 'Hard', minLength: 8, maxLength: 100 },
    { name: 'Any', minLength: 0, maxLength: 100 }
	];
	chosenDifficulty;
	startButtonText = 'Start Game';
	activeGame = false;
	wonGame = false;
	quitGame = false;

	resetBoard() {
	  // resets the board and word currently being constructed
    this.chosenLetters = [];
    this.letters.forEach((letter) => {
      letter.used = false;
      letter.active = false;
      letter.hint = false;
    });
	}

	getWords() {
	  // start the game and retrieves words from the dictionary api and then selects one that fits the difficulty selected
    this.chosenLetters = [];
	  this.submittedValidWords = [];
	  this.submittedInvalidWords = [];
    const difficulty = this.difficultyOptions.find((option) => option.name === this.chosenDifficulty);
		this.http.get('https://random-word-api.herokuapp.com/word?number=100').subscribe((response: any) => {
		  this.wonGame = false;
		  this.boardDisabled = false;
		  this.word = response.find((word) => word.length >= difficulty.minLength && word.length <= difficulty.maxLength).toUpperCase();
		  this.scrambleWord();
		  this.buttonsDisabled = false;
		  this.startButtonText = 'Restart Game';
		  this.activeGame = true;
		});
	}

	scrambleWord() {
	  // takes the selected word, splits the letters into an array and scrambles them
	  this.letters = shuffle(this.word.split('')).map((letter, i) => {
      return { character: letter, index: i, used: false, active: false, hint: false };
    });
	}

	selectLetter(selectedLetter) {
	  // runs when a letter is clicked
	  if(!selectedLetter.used && !this.boardDisabled) {
	    if(!selectedLetter.active) {
	      this.letters.forEach((letter) => {
	        letter.hint = false;
	        if(letter.active) {
	          letter.used = true;
	        }
	        letter.active = selectedLetter.index === letter.index;
        });
       this.chosenLetters.push(selectedLetter.index);
	    } else {
        this.chosenLetters.pop();
        this.letters.forEach((letter) => {
          letter.hint = false;
          letter.active = letter.index === this.chosenLetters[this.chosenLetters.length - 1];
          letter.used = letter.used && letter.active ? false : letter.used;
        });
	    }
    }
	}

	isWordUsed() {
	  // checks if the constructed word is already submitted and if so the submitted button is disabled
	  return this.submittedValidWords.some((word) => word === this.convertToWord()) || this.submittedInvalidWords.some((word) => word === this.convertToWord());
	}

	sendHint() {
	  // will hint a letter
	  if(!this.chosenLetters.length || this.word.indexOf(this.convertToWord().charAt(0)) !== 0) {
      this.letters.find((letter) => this.word.indexOf(letter.character) === 0).hint = true;
      if(this.chosenLetters.length) {
        setTimeout(() => {
          this.letters.find((letter) => this.word.indexOf(letter.character) === 0).hint = false;
        }, 500)
      }
	  }
    if(this.chosenLetters.length && this.word.indexOf(this.convertToWord()) === 0 && this.word !== this.convertToWord()) {
      console.log(1);
      this.letters.find((letter) => letter.character === this.word.charAt(this.chosenLetters.length) && !letter.used && !letter.active).hint = true;
    }
	}

	convertToWord() {
	  // combines the selected letters into a word
	  return this.chosenLetters.map((index) => this.letters.find((letter) => letter.index === index).character).join('');
	}

	submitWord() {
	  // checks if the constructed word is the original word, and if it isn't will check via the api if the word is valid
	  this.buttonsDisabled = true;
	  if(this.convertToWord() === this.word) {
	    this.submittedValidWords.push(this.convertToWord());
	    this.boardDisabled = true;
	    this.wonGame = true;
	    this.startButtonText = 'Play Again';
      this.letters.forEach((letter) => {
        letter.used = true;
        letter.active = false;
        letter.hint = false;
      });
    } else {
      this.http.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${this.convertToWord()}`).subscribe((response) => {
        this.submittedValidWords.push(this.convertToWord());
        this.resetBoard();
        this.buttonsDisabled = false;
      }, (error) => {
        this.submittedInvalidWords.push(this.convertToWord());
        this.resetBoard();
        this.buttonsDisabled = false;
      });
    }
	}

	shutDown() {
	  // hides the game and instructions and only shows thank you message
	  console.log('got here');
	  this.activeGame = false;
	  this.wonGame = false;
	  this.quitGame = true;
	}
}
