const OpenAI = require('openai-api')
const fetch = require('node-fetch')
const _ = require('lodash')
require('dotenv').config() 
const openai = new OpenAI(process.env.OPENAI_API_KEY)


const exampleRepos = [
    {
        name: 'mac-gallagher/MultiProgressView',
        description: '📊 An animatable view that depicts multiple progresses over time. Modeled after UIProgressView',
        language: 'Swift',
        url: 'https://github.com/mac-gallagher/MultiProgressView'
      },
      {
        name: 'huggingface/datasets',
        description: '🤗 The largest hub of ready-to-use datasets for ML models with fast, easy-to-use and efficient data manipulation tools',
        language: 'Python',
        url: 'https://github.com/huggingface/datasets'
      },
      {
        name: 'doersino/tixyz',
        description: 'A minimalist three-dimensional coding environment. Control 8x8x8 dots with a single JavaScript function.',
        language: 'JavaScript',
        url: 'https://github.com/doersino/tixyz'
      },
      {
        name: 'mattermost/mattermost-server',
        description: 'Open source Slack-alternative in Golang and React - Mattermost',
        language: 'Go',
        url: 'https://github.com/mattermost/mattermost-server'
      }
]

const fetchTopN = (documents, n) => {
	return documents.sort((a, b) => {
		return b.score - a.score;
	}).slice(0, n).map(document => document.document);
};

const searchStars = async (query, docs, topN = 1) => {
    const scoredDocs = []
    const docStrings = docs.map(doc => `${doc.name}|${doc.description}|${doc.language}`)
    const chunks = _.chunk(docStrings, 2)
    for (let i = 0; i < chunks.length; i++) {
        const docIdx = 2 * i
        const chunk = chunks[i]
        const res = await openai.search({
            query,
            documents: chunk,
            engine: 'ada'
        })
        const addIdx = res.data.data.map(doc => ({...doc, document: doc.document + docIdx}))
        scoredDocs.push(...addIdx)
    }
    const top = fetchTopN(scoredDocs, topN)
    top.map(idx => console.log(docs[idx]))
}



const fetchPage = async (rootUrl, pageNum) => {
    const url = `${rootUrl}?page=${pageNum}`
    const response = await fetch(url)
    const json = await response.json()
    return json
}

const fetchAllStarredRepos = async (username) => {
    const rootUrl = `https://api.github.com/users/${username}/starred`
    let pageNum = 1
    let repos = []
    let stopped = false
    while (!stopped) {
        const json = await fetchPage(rootUrl, pageNum)
        if (json.length === 0) {
            stopped = true
        } else {
            const reposJSON = await fetchPage(rootUrl, pageNum)
            const reposMap = reposJSON.map(repo => ({ 
                name: repo.full_name,
                description: repo.description,
                language: repo.language,
                url: repo.html_url,
            }))
            repos = repos.concat(reposMap)
            pageNum++
            console.log(`Fetched page ${pageNum}`)
        }
    }
    console.log(`Fetched ${repos.length} repos`)
    return repos    

}

const main = async () => {
    // const repos = await fetchAllStarredRepos('bramses')
    searchStars('slack', exampleRepos, 2)
}

main()