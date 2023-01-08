import '../node_modules/normalize.css/normalize.css';
import './style.css';

/*
 * Задание:
 * Реализовать ToDoList приложение которое будет отображать список всех дел
 * Можно: просмотреть список всех дел, добавить todo и удалить, а так же изменить
 *
 * */

class ApiService {
    fetchAllTodos() {
        return fetch('/api/todos').then((res) => res.json());
    }

    create(data) {
        return fetch('/api/todos', {
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
        return fetch(`/api/todos/${id}`, {
            method: 'DELETE',
        });
    }
}

// Отвечает за рендер
class TodoService {
    toToList;

    constructor(api) {
        this.api = api;
        this.toToList = window.document.querySelector('.todo-list');
        this._handleRemove = this._handleRemove.bind(this);
    }

    addTodo(number, title, description) {
        this.toToList.append(this._createTodo(number, title, description));
    }

    _createTodo(number, title, description) {
        const container = document.createElement('div');
        container.classList.add('todo-list__item');
        container.cardId = number;
        container.classList.add('card');
        const header = document.createElement('div');
        header.classList.add('card__header');
        const content = document.createElement('div');
        content.classList.add('card__content');

        const numberEl = document.createElement('h3');
        numberEl.append(document.createTextNode(number));
        numberEl.classList.add('card__number');

        const titleEl = document.createElement('h3');
        titleEl.append(document.createTextNode(title));
        titleEl.classList.add('card__title');

        content.append(document.createTextNode(description));
        content.classList.add('card__description');

        const btnEl = document.createElement('button');
        btnEl.append(document.createTextNode('x'));
        btnEl.classList.add('card__remove');

        header.append(numberEl);
        header.append(titleEl);
        header.append(btnEl);

        container.append(header);
        container.append(content);
        btnEl.addEventListener('click', this._handleRemove);

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
}

class MainService {
    constructor(todoService, modalService, api) {
        this.modalService = modalService;
        this.api = api;
        this.todoService = todoService;
        document.getElementsByClassName('app');
        this.btn = document.getElementById('addBtn');
        this.btn.addEventListener('click', (e) => this._onOpenModal(e));
    }

    fetchAllTodo() {
        this.api.fetchAllTodos().then((todos) => {
            todos.forEach((todo) =>
                this.todoService.addTodo(todo.id, todo.title, todo.description)
            );
        });
    }

    _onOpenModal() {
        this.modalService.open();
    }
}

class ModalService {
    constructor(todoService, api) {
        this.api = api;
        this.todoService = todoService;
        this.overlay = document.querySelector('.overlay');
        this.modal = document.querySelector('.modal');

        this.listener = this.close.bind(this);
        document
            .querySelector('.modal svg')
            .addEventListener('click', this.listener);

        this.submitBtn = document.querySelector('.submit-btn');
        this.submitBtn.addEventListener('click', this._onCreate.bind(this));
    }

    open() {
        this.modal.classList.add('active');
        this.overlay.classList.add('active');
    }

    close() {
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
            this.todoService.addTodo(data.id, data.title, data.description);
        });
        form.reset();
        this.close();
    }

    _validateForm(form, formData) {
        const errors = [];
        //вместо if используются отдельные функции-валидаторы
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
const modalService = new ModalService(todoService, api);
const service = new MainService(todoService, modalService, api);
service.fetchAllTodo();
//todo: изменение не реализовано
