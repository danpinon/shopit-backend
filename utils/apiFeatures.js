class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this. queryStr = queryStr
    }

    search(){
        const keyword = this.queryStr.keyword ? {
            name: {
                $regex: this.queryStr.keyword,
                $options: 'i'
            }
        } : {}

        console.log(keyword)
        this.query = this.query.find({...keyword})
        return this
    }
    filter(){
        const queryCopy = { ...this.queryStr }

        //REMOVING FIELDS FROM THE QUERY
        const removeFields = ['keyword', 'limit', 'page']
        removeFields.forEach(el => delete queryCopy[el])

        
        //ADVANCE FILTER FOR PRICE, RATINGS, ETC.
        let queryStr = JSON.stringify(queryCopy)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`)
        
        console.log('query copy', queryCopy)


        this.query = this.query.find(JSON.parse(queryStr))
        return this
    }
    pagination(resPerPage){
        const currentPage = Number(this.queryStr.page) || 1
        const skip = resPerPage * (currentPage - 1)

        this.query = this.query.limit(resPerPage).skip(skip)
        return this
    }
}

module.exports = APIFeatures