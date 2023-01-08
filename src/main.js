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

    update(id, data) {
        return fetch(`/api/todos/${id}`, {
            method: 'PUT',
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

    addTodo(number, title, description) {
        this.toDoList.append(this._createTodo(number, title, description));
    }

    updateTodo(number, title, description) {
        console.log(number, title, description);
        this.toDoList.replaceChild(this._createTodo(number, title, description), this.toDoList.children[number - 1]);
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

        const btnUpdate = document.createElement('button');
        btnUpdate.append(document.createTextNode('Update ToDo'));
        btnUpdate.classList.add('card__update');

        const btnEl = document.createElement('button');
        btnEl.append(document.createTextNode('x'));
        btnEl.classList.add('card__remove');

        header.append(numberEl);
        header.append(titleEl);
        header.append(btnUpdate);
        header.append(btnEl);

        container.append(header);
        container.append(content);

        btnEl.addEventListener('click', this._handleRemove);
        btnUpdate.addEventListener('click', this._handleUpdate);

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
        const modal = new ModalService(this, this.api, 'update', card);
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
                this.todoService.addTodo(todo.id, todo.title, todo.description)
            );
        });
    }

    _onOpenModal() {
        this.modalService = new ModalService(this.todoService, this.api);
        this.modalService.open();
    }
}

class ModalService {
    constructor(todoService, api, flag = 'create', card = null) {
        this.api = api;
        this.todoService = todoService;
        this.overlay = document.querySelector('.overlay');
        this.modal = document.querySelector('.modal');
        this.title = document.querySelector('.modal__title');
        this.flag = flag;
        this.card = card;

        this.listener = this.close.bind(this);
        document
            .querySelector('.modal svg')
            .addEventListener('click', this.listener);

        this.submitBtn = document.querySelector('.submit-btn');

        if (this.flag === 'create') {
            this.submitBtn.textContent = 'Создать ToDo';
            this.submitBtn.addEventListener('click', this._onCreate.bind(this), {once: true});
            this.title.textContent = 'Добавление ToDo';
        }
        else {
            this.submitBtn.textContent = 'Обновить ToDo';
            this.submitBtn.addEventListener('click', this._onUpdate.bind(this), {once: true});
            this.title.textContent = 'Обновление ToDo';
        }
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
        this.todoService.updateTodo(cardNumber, formData.title, formData.description);

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
const service = new MainService(todoService, api);
service.fetchAllTodo();
