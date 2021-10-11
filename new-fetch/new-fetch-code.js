// https://levelup.gitconnected.com/combining-api-calls-with-javascript-try-catch-ba1b7b9303a5
const getCovidData = async () => {
  const request = await fetch("https://covid19.mathdro.id/api");
  const data = await request.json();
  return data;
};

const getMoreAPIDataWithUrl = async newUrl => {
  const request = await fetch(newUrl);
  const data = await request.json();
  return data;
};

const callDataInOrder = async () => {
  const covidData = await getCovidData();
  console.log('index.html 27 | covid Data', covidData);

  const detailData = await getMoreAPIDataWithUrl(covidData.confirmed.detail);
  console.log('index.html 31 | detail Data', detailData);
};

callDataInOrder();


// https://dmitripavlutin.com/javascript-fetch-async-await/

// Single fetch

async function fetchMoviesJSON() {
  const response = await fetch('/movies');

  // response.ok;     // => false
  // response.status; // => 404

  if (!response.ok) {
    const message = `An error has occured: ${response.status}`;
    throw new Error(message);
  }

  const movies = await response.json();
  return movies;
}

fetchMoviesJSON().then(movies => {
  movies; // fetched movies
});

fetchMoviesBadStatus().catch(error => {
  error.message; // 'An error has occurred: 404'
});

// Multiple fetch

async function fetchMoviesAndCategories() {
  const [moviesResponse, categoriesResponse] = await Promise.all([
    fetch('/movies'),
    fetch('/categories')
  ]);
  const movies = await moviesResponse.json();
  const categories = await categoriesResponse.json();
  return [movies, categories];
}

fetchMoviesAndCategories().then(([movies, categories]) => {
  movies;
  categories;
}).catch(error => {
  // /movies or /categories request failed
});


// https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await

// Single

async function myFetch() {
  try {
    let response = await fetch('coffee.jpg');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let myBlob = await response.blob();

    let objectURL = URL.createObjectURL(myBlob);
    let image = document.createElement('img');
    image.src = objectURL;
    document.body.appendChild(image);

  } catch(e) {
    console.log('There has been a problem with your fetch operation: ' + e);
  }
}

myFetch();

// Multiple

async function fetchAndDecode(url, type) {
  let response = await fetch(url);

  let content;

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  } else {
    if(type === 'blob') {
      content = await response.blob();
    } else if(type === 'text') {
      content = await response.text();
    }
  }

  return content;
}

async function displayContent() {
  let coffee = fetchAndDecode('coffee.jpg', 'blob');
  let tea = fetchAndDecode('tea.jpg', 'blob');
  let description = fetchAndDecode('description.txt', 'text');

  let values = await Promise.all([coffee, tea, description]);

  let objectURL1 = URL.createObjectURL(values[0]);
  let objectURL2 = URL.createObjectURL(values[1]);
  let descText = values[2];

  let image1 = document.createElement('img');
  let image2 = document.createElement('img');
  image1.src = objectURL1;
  image2.src = objectURL2;
  document.body.appendChild(image1);
  document.body.appendChild(image2);

  let para = document.createElement('p');
  para.textContent = descText;
  document.body.appendChild(para);
}

displayContent()
.catch((e) =>
  console.log(e)
);


// https://levelup.gitconnected.com/async-await-vs-promises-4fe98d11038f
// Error handling with promises and async/await is fairly similar. For successfully resolved promises, we’ll use then or try. For rejected promises, we’ll use catch. For code that we want to run after a promise has been handled, regardless of whether it was resolved or rejected, we’ll use finally:
let isOurPromiseFinished = false;
const myAsyncAwaitBlock = async (str) => {
  try {
    // If the promise resolves, we enter this code block
    const myPromise = await returnsAPromise(str);
    console.log(`using async/await, ${res}`);
  } catch(err) {
    // If the promise rejects, we enter this code block
    console.log(err);
  } finally {
    /* This is for code that doesn't rely on the outcome of the    
    promise but still needs to run once it's handled */
    isOurPromiseFinished = true;
  }
}
myAsyncAwaitBlock(myFirstString);

