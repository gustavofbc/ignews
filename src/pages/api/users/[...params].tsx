import { NextApiRequest, NextApiResponse } from 'next'

export default (request: NextApiRequest, response: NextApiResponse) => {
    console.log(request.query)

    const users = [
        { id: 1, name: 'Gustavo' },
        { id: 2, name: 'Danilo' },
        { id: 3, name: 'Cadu' },
    ]

    return response.json(users);
}