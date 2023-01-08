//node >= 16
import http from 'http';

//-------------------- Mock DB

class Repository {
    _todos;
    _idSequence = 2;

    constructor() {
        this._todos = [
            {
                id: 1,
                title: 'Сделать практику',
                description: 'Сделать практику по dom и fetch',
            },
            {
                id: 2,
                title: 'Прочесть лекцию',
                description:
                    'Прочесть лекцию по dom promise fetch. А так же познакомиться с RegExp',
            },
        ];
    }

    create(data) {
        const {title, description} = data;

        this._idSequence = this._idSequence + 1;
        const created = {id: this._idSequence, title, description};

        this._todos.push(created);
        return created;
    }

    getAll() {
        return [...this._todos];
    }

    getById(id) {
        const todo = this._todos.find((item) => item.id === id);

        if (!todo) {
            throw new Error('Not found');
        }

        return todo;
    }

    removeById(id) {
        if (this._todos.findIndex((item) => item.id === id) === -1) {
            throw new Error('Not found');
        }

        this._todos = this._todos.filter((item) => item.id !== id);
    }

    update(id, data) {
        if (this._todos.findIndex((item) => item.id === id) === -1) {
            throw new Error('Not found');
        }

        this._todos = this._todos.map((item) => {
            if (item.id === id) {
                return {id, title: data.title, description: data.description};
            }

            return item;
        });
    }
}

//-------------------- Router

class TodoRouter {
    _getAllEndpoint;
    _createEndpoint;
    _getOneRegExp;
    _removeOneRegExp;
    _updateOneRegExp;

    constructor() {
        this._getAllEndpoint = '/api/todos';
        this._createEndpoint = this._getAllEndpoint;
        this._getOneRegExp = /\/api\/todos\/([0-9]+)/;
        this._removeOneRegExp = this._getOneRegExp;
        this._updateOneRegExp = this._getOneRegExp;
    }

    isGetAll(req) {
        return req.url === this._getAllEndpoint && req.method === 'GET';
    }

    isCreate(req) {
        return req.url === this._createEndpoint && req.method === 'POST';
    }

    isGet(req) {
        return (
            this._isMatchToRoute(req, this._getOneRegExp) &&
            req.method === 'GET'
        );
    }

    isDelete(req) {
        return (
            this._isMatchToRoute(req, this._removeOneRegExp) &&
            req.method === 'DELETE'
        );
    }

    isUpdate(req) {
        return (
            this._isMatchToRoute(req, this._updateOneRegExp) &&
            req.method === 'PUT'
        );
    }

    _isMatchToRoute(req, regexp) {
        return req.url.match(regexp);
    }
}

//-------------------- Helper

function defaultOkResponseHandler(res, data) {
    res.writeHead(200, {
        'Content-Type': 'application/json',
    });
    res.end(JSON.stringify(data));
}

function defaultErrorResponseHandler(res, error) {
    res.writeHead(404, {
        'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({message: error}));
}

function getRequestDate(req) {
    return new Promise((resolve, reject) => {
        try {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });
            req.on('end', () => {
                resolve(body);
            });
        } catch (error) {
            reject(error);
        }
    }).then((body) => JSON.parse(body));
}

//-------------------- Server

const todoRepository = new Repository();
const router = new TodoRouter();
const server = http.createServer(async (req, res) => {
    try {
        if (router.isGetAll(req)) {
            const data = todoRepository.getAll();
            defaultOkResponseHandler(res, data);
            return;
        }

        if (router.isGet(req)) {
            const id = +req.url.split('/')[3];
            const data = todoRepository.getById(id);
            defaultOkResponseHandler(res, data);
            return;
        }

        if (router.isCreate(req)) {
            const data = await getRequestDate(req);
            const created = todoRepository.create(data);
            defaultOkResponseHandler(res, created);
            return;
        }

        if (router.isDelete(req)) {
            const id = +req.url.split('/')[3];
            const data = todoRepository.removeById(id);
            defaultOkResponseHandler(res, data);
            return;
        }

        if (router.isUpdate(req)) {
            const id = +req.url.split('/')[3];
            const data = await getRequestDate(req);
            const updated = todoRepository.update(id, data);
            defaultOkResponseHandler(res, updated);
            return;
        }
    } catch (e) {
        console.error(e);
        defaultErrorResponseHandler(res, (e && e.message) || 'Bad request');
        return;
    }

    defaultErrorResponseHandler(res, 'Route not found');
});

const PORT = process.env.PORT || 4300;
server.listen(PORT, () => {
    console.log(`server started on port: ${PORT}`);
    console.log(`server address: http://localhost:${PORT}`);
});
