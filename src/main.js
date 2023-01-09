import '../node_modules/normalize.css/normalize.css';
import './style.css';

/*
 * Задание:
 * Реализовать ToDoList приложение которое будет отображать список всех дел
 * Можно: просмотреть список всех дел, добавить todo и удалить, а так же изменить
 *
 * */

class ApiService {

    fetchNamesById(id) {
        return fetch(`https://jsonplaceholder.typicode.com/users/${id}`).then((res) => res.json());
    }

    fetchAllTodos() {
        return fetch('https://jsonplaceholder.typicode.com/posts').then((res) => res.json());
    }

    create(data) {
        return fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then((res) => {
            return res.json();
        });
    }

    remove(id) {
        return fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
            method: 'DELETE',
        });
    }

    update(id, data) {
        return fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    }
}

// Отвечает за рендер
class TodoService {
    toDoList;

    constructor(api) {
        this.api = api;
        this.toDoList = window.document.querySelector('.todo-list');
        this._handleRemove = this._handleRemove.bind(this);
        this._handleUpdate = this._handleUpdate.bind(this);
    }

    addTodo(number, title, description, userId) {
        this.toDoList.append(this._createTodo(number, title, description, userId));
    }

    updateTodo(card, title, description, userId) {
        this.toDoList.replaceChild(this._createTodo(card.cardId, title, description, userId), card);
    }

    _createTodo(number, title, description, userId) {
        const container = document.createElement('div');
        container.classList.add('todo-list__item');
        container.cardId = number;
        container.cardUserId = userId;
        container.classList.add('card');

        const header = document.createElement('div');
        header.classList.add('card__header');

        const content = document.createElement('div');
        content.classList.add('card__content');

        const numberElement = document.createElement('h3');
        numberElement.append(document.createTextNode('№' + number));
        numberElement.classList.add('card__number');

        const userIdElement = document.createElement('h3');
        this.api.fetchNamesById(userId).then((result) => userIdElement.append(document.createTextNode('User: '+ result.username)));
        userIdElement.classList.add('card__userId');

        const titleElement = document.createElement('h3');
        titleElement.append(document.createTextNode(title));
        titleElement.classList.add('card__title');

        content.append(document.createTextNode(description));
        content.classList.add('card__description');

        const updateButton = document.createElement('button');
        updateButton.append(document.createTextNode('Update'));
        updateButton.classList.add('card__update');

        const deleteButton = document.createElement('button');
        deleteButton.append(document.createTextNode('x'));
        deleteButton.classList.add('card__remove');

        header.append(numberElement);
        header.append(userIdElement);
        header.append(titleElement);
        header.append(updateButton);
        header.append(deleteButton);

        container.append(header);
        container.append(content);

        updateButton.addEventListener('click', this._handleUpdate);
        deleteButton.addEventListener('click', this._handleRemove);

        return container;
    }

    _handleRemove(event) {
        const card = event.target.parentElement.parentElement;
        this.api.remove(card.cardId).then((res) => {
            if (res.status >= 200 && res.status <= 300) {
                event.target.removeEventListener('click', this._handleRemove);
                card.remove();
            }
        });
    }

    _handleUpdate(event) {
        const card = event.target.parentElement.parentElement;
        const title = card.children[0].children[2];
        const description = card.children[1];
        const modal = new ModalService(this, this.api, 'update', card, title, description);
        modal.open();
    }
}

class MainService {
    constructor(todoService, api) {
        this.api = api;
        this.todoService = todoService;
        document.getElementsByClassName('app');
        this.addBtn = document.getElementById('addBtn');
        this.addBtn.addEventListener('click', (e) => this._onOpenModal(e));
    }

    fetchAllTodo() {
        this.api.fetchAllTodos().then((todos) => {
            todos.forEach((todo) =>
                this.todoService.addTodo(todo.id, todo.title, todo.body, todo.userId)
            );
        });
    }

    _onOpenModal() {
        this.modalService = new ModalService(this.todoService, this.api);
        this.modalService.open();
    }
}

class ModalService {
    constructor(todoService, api, flag = 'create', card = null, titleOld = null, descriptionOld = null) {
        this.api = api;
        this.todoService = todoService;
        this.overlay = document.querySelector('.overlay');
        this.modal = document.querySelector('.modal');
        this.title = document.querySelector('.modal__title');
        this.controlTitle = document.querySelector('.modal__control-title');
        this.description = document.querySelector('.modal__control-des');
        this.flag = flag;
        this.card = card;
        this.titleOld = titleOld;
        this.descriptionOld = descriptionOld;
        this.createBind = this._onCreate.bind(this);
        this.updateBind = this._onUpdate.bind(this);


        this.listener = this.close.bind(this);
        document
            .querySelector('.modal svg')
            .addEventListener('click', this.listener);

        this.submitBtn = document.querySelector('.submit-btn');

        if (this.flag === 'create') {
            this.submitBtn.textContent = 'Создать ToDo';
            this.submitBtn.addEventListener('click', this.createBind);
            this.title.textContent = 'Добавление ToDo';
        }
        else {
            this.controlTitle.value = this.titleOld.textContent;
            this.description.textContent = this.descriptionOld.textContent;
            this.submitBtn.textContent = 'Обновить ToDo';
            this.submitBtn.addEventListener('click', this.updateBind);
            this.title.textContent = 'Обновление ToDo';
        }
    }

    open() {
        document.forms[0].getElementsByClassName('form-errors')[0].innerHTML = '';
        this.modal.classList.add('active');
        this.overlay.classList.add('active');
    }

    close() {
        this.submitBtn.removeEventListener('click', this.updateBind);
        this.submitBtn.removeEventListener('click', this.createBind);
        this.modal.classList.remove('active');
        this.overlay.classList.remove('active');
    }

    _onCreate(e) {
        e.preventDefault();

        const formData = {};
        const form = document.forms[0];

        Array.from(form.elements)
            .filter((item) => !!item.name)
            .forEach((elem) => {
                formData[elem.name] = elem.value;
            });

        if (!this._validateForm(form, formData)) {
            return;
        }

        this.api.create(formData).then((data) => {
            this.todoService.addTodo(data.id, data.title, data.description, data.userId);
        });

        form.reset();
        this.close();
    }

    _onUpdate(e) {
        e.preventDefault();

        const formData = {};
        const form = document.forms[0];

        Array.from(form.elements)
            .filter((item) => !!item.name)
            .forEach((elem) => {
                formData[elem.name] = elem.value;
            });

        if (!this._validateForm(form, formData)) {
            return;
        }

        let cardNumber = this.card.cardId;
        this.api.update(cardNumber, formData);
        this.todoService.updateTodo(this.card, formData.title, formData.description, formData.userId);

        form.reset();
        this.close();
    }

    _validateForm(form, formData) {
        const errors = [];
        if (formData.userId >= 11 || formData.userId <= 0) {
            errors.push('Поле UserId должно содержать число от 1 до 10');
        }
        if (formData.title.length >= 30) {
            errors.push('Поле наименование должно иметь не более 30 символов');
        }
        if (!formData.description.length) {
            errors.push('Поле описание должно быть заполнено');
        }
        if (errors.length) {
            const errorEl = form.getElementsByClassName('form-errors')[0];
            errorEl.innerHTML = errors.map((er) => `<div>${er}</div>`).join('');

            return false;
        }

        return true;
    }
}

const api = new ApiService();
const todoService = new TodoService(api);
const service = new MainService(todoService, api);
service.fetchAllTodo();
