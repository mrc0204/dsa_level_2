export function normalizeTitle(title) {
    return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function findByTitle(questions, rawTitle) {
    const key = normalizeTitle(rawTitle);
    return questions.find(q => q.titleKey === key) || null;
}

export function getFilteredSortedQuestions(questions, { search = '', category = '', sort = 'newest' }) {
    const q = search.trim().toLowerCase();

    let list = questions.filter(item => {
        const matchesSearch = !q || item.title.toLowerCase().includes(q);
        const matchesCat = !category || item.category === category;
        return matchesSearch && matchesCat;
    });

    list = list.slice();

    switch (sort) {
        case 'newest':
            list.sort((a, b) => b.addedAt - a.addedAt);
            break;
        case 'most':
            list.sort((a, b) => b.count - a.count);
            break;
        case 'least':
            list.sort((a, b) => a.count - b.count);
            break;
        case 'alpha':
            list.sort((a, b) => a.title.localeCompare(b.title));
            break;
        default:
            break;
    }

    return list;
}
