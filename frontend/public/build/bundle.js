
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.59.2 */

    const { Error: Error_1, console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	child_ctx[14] = list;
    	child_ctx[15] = i;
    	return child_ctx;
    }

    // (128:2) {#each todos as todo}
    function create_each_block(ctx) {
    	let li;
    	let h3;
    	let t0_value = /*todo*/ ctx[13].title + "";
    	let t0;
    	let t1;
    	let textarea0;
    	let t2;
    	let p;
    	let t3_value = /*todo*/ ctx[13].noteContent + "";
    	let t3;
    	let t4;
    	let textarea1;
    	let t5;
    	let button0;
    	let t7;
    	let button1;
    	let t9;
    	let mounted;
    	let dispose;

    	function textarea0_input_handler() {
    		/*textarea0_input_handler*/ ctx[8].call(textarea0, /*each_value*/ ctx[14], /*todo_index*/ ctx[15]);
    	}

    	function textarea1_input_handler() {
    		/*textarea1_input_handler*/ ctx[9].call(textarea1, /*each_value*/ ctx[14], /*todo_index*/ ctx[15]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[10](/*todo*/ ctx[13]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[11](/*todo*/ ctx[13]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			textarea0 = element("textarea");
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			textarea1 = element("textarea");
    			t5 = space();
    			button0 = element("button");
    			button0.textContent = "Atualizar";
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "Excluir";
    			t9 = space();
    			add_location(h3, file, 129, 6, 3168);
    			add_location(textarea0, file, 130, 6, 3197);
    			add_location(p, file, 131, 6, 3250);
    			add_location(textarea1, file, 132, 6, 3283);
    			add_location(button0, file, 133, 6, 3342);
    			add_location(button1, file, 134, 6, 3443);
    			add_location(li, file, 128, 4, 3156);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, h3);
    			append_dev(h3, t0);
    			append_dev(li, t1);
    			append_dev(li, textarea0);
    			set_input_value(textarea0, /*todo*/ ctx[13].title);
    			append_dev(li, t2);
    			append_dev(li, p);
    			append_dev(p, t3);
    			append_dev(li, t4);
    			append_dev(li, textarea1);
    			set_input_value(textarea1, /*todo*/ ctx[13].noteContent);
    			append_dev(li, t5);
    			append_dev(li, button0);
    			append_dev(li, t7);
    			append_dev(li, button1);
    			append_dev(li, t9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea0, "input", textarea0_input_handler),
    					listen_dev(textarea1, "input", textarea1_input_handler),
    					listen_dev(button0, "click", click_handler, false, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*todos*/ 1 && t0_value !== (t0_value = /*todo*/ ctx[13].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todos*/ 1) {
    				set_input_value(textarea0, /*todo*/ ctx[13].title);
    			}

    			if (dirty & /*todos*/ 1 && t3_value !== (t3_value = /*todo*/ ctx[13].noteContent + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*todos*/ 1) {
    				set_input_value(textarea1, /*todo*/ ctx[13].noteContent);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(128:2) {#each todos as todo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let h1;
    	let t1;
    	let form;
    	let label0;
    	let t2;
    	let input;
    	let t3;
    	let label1;
    	let t4;
    	let textarea;
    	let t5;
    	let button;
    	let t7;
    	let ul;
    	let mounted;
    	let dispose;
    	let each_value = /*todos*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Lista de Tarefas";
    			t1 = space();
    			form = element("form");
    			label0 = element("label");
    			t2 = text("Título:\r\n\t  \r\n\t  ");
    			input = element("input");
    			t3 = space();
    			label1 = element("label");
    			t4 = text("Conteúdo da Tarefa:\r\n\t  ");
    			textarea = element("textarea");
    			t5 = space();
    			button = element("button");
    			button.textContent = "Criar Tarefa";
    			t7 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file, 100, 2, 2444);
    			attr_dev(input, "type", "text");
    			add_location(input, file, 107, 3, 2652);
    			add_location(label0, file, 104, 1, 2573);
    			add_location(textarea, file, 111, 3, 2742);
    			add_location(label1, file, 109, 1, 2706);
    			attr_dev(button, "type", "submit");
    			add_location(button, file, 114, 1, 2865);
    			add_location(form, file, 103, 2, 2524);
    			add_location(ul, file, 126, 0, 3121);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, label0);
    			append_dev(label0, t2);
    			append_dev(label0, input);
    			set_input_value(input, /*title*/ ctx[1]);
    			append_dev(form, t3);
    			append_dev(form, label1);
    			append_dev(label1, t4);
    			append_dev(label1, textarea);
    			set_input_value(textarea, /*noteContent*/ ctx[2]);
    			append_dev(form, t5);
    			append_dev(form, button);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[7]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[3]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 2 && input.value !== /*title*/ ctx[1]) {
    				set_input_value(input, /*title*/ ctx[1]);
    			}

    			if (dirty & /*noteContent*/ 4) {
    				set_input_value(textarea, /*noteContent*/ ctx[2]);
    			}

    			if (dirty & /*deleteTodo, todos, updateNote*/ 49) {
    				each_value = /*todos*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(form);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let todos = [];
    	let title = '';
    	let noteContent = '';

    	async function handleSubmit() {
    		const data = { title, noteContent };

    		try {
    			const response = await fetch('http://localhost:3003/todos', {
    				method: 'POST',
    				headers: { 'Content-Type': 'application/json' },
    				body: JSON.stringify(data)
    			});

    			if (!response.ok) {
    				throw new Error('Erro ao criar tarefa');
    			}

    			const createdTodo = await response.json();
    			console.log('Tarefa criada:', createdTodo);
    			$$invalidate(0, todos = [...todos, createdTodo]);
    		} catch(error) {
    			console.error('Erro:', error.message);
    		} // Trate o erro de acordo com a sua necessidade
    	}

    	const fetchTodos = async () => {
    		try {
    			const response = await fetch('http://localhost:3003/todos');

    			if (!response.ok) {
    				throw new Error('Erro ao buscar as tarefas');
    			}

    			$$invalidate(0, todos = await response.json());
    		} catch(error) {
    			console.error('Erro:', error.message);
    		}
    	};

    	const deleteTodo = async id => {
    		try {
    			const response = await fetch(`http://localhost:3003/todos/${id}`, { method: 'DELETE' });

    			if (!response.ok) {
    				throw new Error('Erro ao excluir tarefa');
    			}

    			$$invalidate(0, todos = todos.filter(todo => todo.id !== id));
    			console.log('Tarefa excluída:', id);
    		} catch(error) {
    			console.error('Erro:', error.message);
    		} // Trate o erro de acordo com a sua necessidade
    	};

    	const updateNote = async (id, newTitle, newNoteContent) => {
    		try {
    			const data = {
    				title: newTitle,
    				noteContent: newNoteContent
    			};

    			const response = await fetch(`http://localhost:3003/todos/${id}`, {
    				method: 'PATCH',
    				headers: { 'Content-Type': 'application/json' },
    				body: JSON.stringify(data)
    			});

    			if (!response.ok) {
    				throw new Error('Erro ao atualizar tarefa');
    			}

    			const updatedTodo = await response.json();
    			console.log('Tarefa atualizada:', updatedTodo);

    			$$invalidate(0, todos = todos.map(todo => {
    				if (todo.id === updatedTodo.id) {
    					return updatedTodo;
    				}

    				return todo;
    			}));
    		} catch(error) {
    			console.error('Erro:', error.message);
    		} // Trate o erro de acordo com a sua necessidade
    	};

    	fetchTodos();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		title = this.value;
    		$$invalidate(1, title);
    	}

    	function textarea_input_handler() {
    		noteContent = this.value;
    		$$invalidate(2, noteContent);
    	}

    	function textarea0_input_handler(each_value, todo_index) {
    		each_value[todo_index].title = this.value;
    		$$invalidate(0, todos);
    	}

    	function textarea1_input_handler(each_value, todo_index) {
    		each_value[todo_index].noteContent = this.value;
    		$$invalidate(0, todos);
    	}

    	const click_handler = todo => updateNote(todo.id, todo.title, todo.noteContent);
    	const click_handler_1 = todo => deleteTodo(todo.id);

    	$$self.$capture_state = () => ({
    		todos,
    		title,
    		noteContent,
    		handleSubmit,
    		fetchTodos,
    		deleteTodo,
    		updateNote
    	});

    	$$self.$inject_state = $$props => {
    		if ('todos' in $$props) $$invalidate(0, todos = $$props.todos);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('noteContent' in $$props) $$invalidate(2, noteContent = $$props.noteContent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		todos,
    		title,
    		noteContent,
    		handleSubmit,
    		deleteTodo,
    		updateNote,
    		input_input_handler,
    		textarea_input_handler,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Pedro'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
