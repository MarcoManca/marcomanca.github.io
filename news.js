// publications.js
// This file handles fetching and displaying news from the API for the News section.

let newsOffset = 0;
let newsListFromAPI = [];
let allNewsLoaded = false;

function renderNews(newsToRender, append = false) {
    const newsSection = document.getElementById('news-section');
    if (!append) newsSection.innerHTML = '';
    newsToRender.forEach((news, idx) => {
        const article = document.createElement('article');
        article.className = 'news-article';

        // Title
        const h3 = document.createElement('h3');
        h3.textContent = news.titolo;
        article.appendChild(h3);

        // Date
        const dateSpan = document.createElement('span');
        dateSpan.className = 'news-date';
        // Format date in Italian format
        const dateObj = new Date(news.data);
        const formattedDate = dateObj.toLocaleDateString('it-IT');
        dateSpan.textContent = formattedDate;
        article.appendChild(dateSpan);

        // Preview
        const p = document.createElement('p');
        p.textContent = news.anteprima;
        article.appendChild(p);

        // Accordion button
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'accordion-toggle';
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', `news-details-${news.id}`);
        button.id = `accordion-btn-${news.id}`;
        button.textContent = 'Read more';
        button.setAttribute('aria-label', `Read more about ${news.titolo}`) || `Read more`;
        article.appendChild(button);

        // Hidden details
        const details = document.createElement('div');
        details.id = `news-details-${news.id}`;
        details.className = 'accordion-panel';
        details.setAttribute('role', 'region');
        details.setAttribute('aria-labelledby', button.id);
        details.hidden = true;
        details.tabIndex = -1;
        details.innerHTML = news.testo;
        article.appendChild(details);

        // Accessible accordion logic
        button.addEventListener('click', function () {
            const expanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', String(!expanded));
            if (expanded) {
                details.hidden = true;
                details.tabIndex = -1;
            } else {
                details.hidden = false;
                details.tabIndex = 0;
                details.focus && details.focus();
            }
        });

        // ESC key closes the accordion if open
        details.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                if (button.getAttribute('aria-expanded') === 'true') {
                    button.setAttribute('aria-expanded', 'false');
                    details.hidden = true;
                    details.tabIndex = -1;
                    button.focus();
                }
            }
        });

        newsSection.appendChild(article);
    });
}

function loadMoreNews() {
    if (allNewsLoaded) return;
    fetch('https://apilab.isti.cnr.it/api/getNewsManca/data/3/6')
        .then(response => response.json())
        .then(newsList => {
            if (!Array.isArray(newsList) || newsList.length === 0) {
                allNewsLoaded = true;
                const btn = document.getElementById('load-more-news');
                if (btn) btn.style.display = 'none';
                return;
            }
            renderNews(newsList, true);
            allNewsLoaded = true;
            const btn = document.getElementById('load-more-news');
            btn.setAttribute('aria-expanded','false');
            if (btn) btn.style.display = 'none';
        })
        .catch(() => {
            const btn = document.getElementById('load-more-news');
            if (btn) btn.style.display = 'none';
        });
}

document.addEventListener('DOMContentLoaded', function () {
    const newsSection = document.getElementById('news-section');
    if (!newsSection) return;
    fetch('https://apilab.isti.cnr.it/api/getNewsManca/homeNews/0/0')
        .then(response => response.json())
        .then(newsList => {
            newsListFromAPI = newsList;
            newsOffset = 0;
            if (!Array.isArray(newsList) || newsList.length === 0) {
                newsSection.innerHTML = '<p>No news available at the moment.</p>';
                return;
            }
            renderNews(newsListFromAPI);
            newsOffset = 3;
            // Bottone e link
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.id = 'load-more-news';
            loadMoreBtn.className = 'btn btn-primary me-2';
            loadMoreBtn.textContent = 'Load more news';
            loadMoreBtn.setAttribute('aria-expanded','true');
            loadMoreBtn.addEventListener('click', loadMoreNews);
            newsSection.parentNode.appendChild(loadMoreBtn);

            const allNewsLink = document.createElement('a');
            allNewsLink.href = 'all-news.html';
            //allNewsLink.className = 'btn btn-outline-primary mt-3';
            allNewsLink.textContent = 'View all news';
            allNewsLink.setAttribute('aria-label', 'View all news grouped by year and month');
            newsSection.parentNode.appendChild(allNewsLink);
        })
        .catch(err => {
            newsSection.innerHTML = '<p>Error loading news.</p>';
        });
});
