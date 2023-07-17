
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    // (185:8) {:else}
    function create_else_block(ctx) {
    	let div;
    	let input;
    	let input_checked_value;
    	let t0;
    	let label;
    	let t2;
    	let h3;
    	let t3_value = /*todo*/ ctx[20].title + "";
    	let t3;
    	let t4;
    	let p;
    	let t5_value = /*todo*/ ctx[20].noteContent + "";
    	let t5;
    	let t6;
    	let button0;
    	let t8;
    	let button1;
    	let mounted;
    	let dispose;

    	function change_handler() {
    		return /*change_handler*/ ctx[15](/*todo*/ ctx[20]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[16](/*todo*/ ctx[20]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[17](/*todo*/ ctx[20]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			label.textContent = "Concluído";
    			t2 = space();
    			h3 = element("h3");
    			t3 = text(t3_value);
    			t4 = space();
    			p = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			button0 = element("button");
    			button0.textContent = "Editar";
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "Excluir";
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = /*todo*/ ctx[20].completed;
    			add_location(input, file, 186, 12, 4817);
    			attr_dev(label, "for", "completed");
    			add_location(label, file, 187, 12, 4942);
    			add_location(div, file, 185, 10, 4798);
    			attr_dev(h3, "class", "svelte-1551dgk");
    			toggle_class(h3, "completed", /*todo*/ ctx[20].completed);
    			add_location(h3, file, 189, 10, 5012);
    			attr_dev(p, "class", "svelte-1551dgk");
    			toggle_class(p, "completed", /*todo*/ ctx[20].completed);
    			add_location(p, file, 190, 10, 5078);
    			add_location(button0, file, 191, 10, 5148);
    			add_location(button1, file, 192, 10, 5222);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			append_dev(div, t0);
    			append_dev(div, label);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", change_handler, false, false, false, false),
    					listen_dev(button0, "click", click_handler, false, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*todos*/ 1 && input_checked_value !== (input_checked_value = /*todo*/ ctx[20].completed)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*todos*/ 1 && t3_value !== (t3_value = /*todo*/ ctx[20].title + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*todos*/ 1) {
    				toggle_class(h3, "completed", /*todo*/ ctx[20].completed);
    			}

    			if (dirty & /*todos*/ 1 && t5_value !== (t5_value = /*todo*/ ctx[20].noteContent + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*todos*/ 1) {
    				toggle_class(p, "completed", /*todo*/ ctx[20].completed);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(185:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (172:8) {#if editingTodo && editingTodo.id === todo.id}
    function create_if_block(ctx) {
    	let form;
    	let label0;
    	let t0;
    	let textarea0;
    	let t1;
    	let label1;
    	let t2;
    	let textarea1;
    	let t3;
    	let button0;
    	let t5;
    	let button1;
    	let mounted;
    	let dispose;

    	function submit_handler() {
    		return /*submit_handler*/ ctx[14](/*todo*/ ctx[20]);
    	}

    	const block = {
    		c: function create() {
    			form = element("form");
    			label0 = element("label");
    			t0 = text("Título:\r\n              ");
    			textarea0 = element("textarea");
    			t1 = space();
    			label1 = element("label");
    			t2 = text("Conteúdo da Tarefa:\r\n              ");
    			textarea1 = element("textarea");
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "Atualizar";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Cancelar";
    			add_location(textarea0, file, 175, 14, 4392);
    			add_location(label0, file, 173, 12, 4346);
    			add_location(textarea1, file, 179, 14, 4538);
    			add_location(label1, file, 177, 12, 4480);
    			attr_dev(button0, "type", "submit");
    			add_location(button0, file, 181, 12, 4632);
    			attr_dev(button1, "type", "button");
    			add_location(button1, file, 182, 12, 4686);
    			add_location(form, file, 172, 10, 4229);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, label0);
    			append_dev(label0, t0);
    			append_dev(label0, textarea0);
    			set_input_value(textarea0, /*editingTodo*/ ctx[3].title);
    			append_dev(form, t1);
    			append_dev(form, label1);
    			append_dev(label1, t2);
    			append_dev(label1, textarea1);
    			set_input_value(textarea1, /*editingTodo*/ ctx[3].noteContent);
    			append_dev(form, t3);
    			append_dev(form, button0);
    			append_dev(form, t5);
    			append_dev(form, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[12]),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[13]),
    					listen_dev(button1, "click", /*cancelEditing*/ ctx[9], false, false, false, false),
    					listen_dev(form, "submit", prevent_default(submit_handler), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*editingTodo*/ 8) {
    				set_input_value(textarea0, /*editingTodo*/ ctx[3].title);
    			}

    			if (dirty & /*editingTodo*/ 8) {
    				set_input_value(textarea1, /*editingTodo*/ ctx[3].noteContent);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(172:8) {#if editingTodo && editingTodo.id === todo.id}",
    		ctx
    	});

    	return block;
    }

    // (170:4) {#each todos as todo}
    function create_each_block(ctx) {
    	let li;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*editingTodo*/ ctx[3] && /*editingTodo*/ ctx[3].id === /*todo*/ ctx[20].id) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if_block.c();
    			t = space();
    			add_location(li, file, 170, 6, 4156);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			if_block.m(li, null);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(li, t);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(170:4) {#each todos as todo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
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
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Lista de Tarefas";
    			t1 = space();
    			form = element("form");
    			label0 = element("label");
    			t2 = text("Título:\r\n      ");
    			input = element("input");
    			t3 = space();
    			label1 = element("label");
    			t4 = text("Conteúdo da Tarefa:\r\n      ");
    			textarea = element("textarea");
    			t5 = space();
    			button = element("button");
    			button.textContent = "Criar Tarefa";
    			t7 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file, 153, 2, 3729);
    			attr_dev(input, "type", "text");
    			add_location(input, file, 159, 6, 3889);
    			add_location(label0, file, 157, 4, 3859);
    			add_location(textarea, file, 163, 6, 3991);
    			add_location(label1, file, 161, 4, 3949);
    			attr_dev(button, "type", "submit");
    			add_location(button, file, 165, 4, 4057);
    			add_location(form, file, 156, 2, 3807);
    			add_location(ul, file, 168, 2, 4117);
    			add_location(main, file, 152, 0, 3719);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, form);
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
    			append_dev(main, t7);
    			append_dev(main, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[10]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[11]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[4]), false, true, false, false)
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

    			if (dirty & /*updateNote, todos, editingTodo, cancelEditing, deleteTodo, startEditing, toggleCompletion*/ 1001) {
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
    			if (detaching) detach_dev(main);
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
    	let editingTodo = null;

    	async function handleSubmit() {
    		const data = { title, noteContent, completed: false };

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
    			resetForm();
    		} catch(error) {
    			console.error('Erro:', error.message);
    		} // Trate o erro de acordo com a sua necessidade
    	}

    	const resetForm = () => {
    		$$invalidate(1, title = '');
    		$$invalidate(2, noteContent = '');
    	};

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

    			cancelEditing();
    		} catch(error) {
    			console.error('Erro:', error.message);
    		} // Trate o erro de acordo com a sua necessidade
    	};

    	const toggleCompletion = async (id, completed) => {
    		try {
    			const data = { completed };

    			const response = await fetch(`http://localhost:3003/todos/${id}`, {
    				method: 'PATCH',
    				headers: { 'Content-Type': 'application/json' },
    				body: JSON.stringify(data)
    			});

    			if (!response.ok) {
    				throw new Error('Erro ao atualizar o status da tarefa');
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
    		}
    	};

    	const startEditing = id => {
    		$$invalidate(3, editingTodo = todos.find(todo => todo.id === id));
    	};

    	const cancelEditing = () => {
    		$$invalidate(3, editingTodo = null);
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

    	function textarea0_input_handler() {
    		editingTodo.title = this.value;
    		$$invalidate(3, editingTodo);
    	}

    	function textarea1_input_handler() {
    		editingTodo.noteContent = this.value;
    		$$invalidate(3, editingTodo);
    	}

    	const submit_handler = todo => updateNote(todo.id, editingTodo.title, editingTodo.noteContent);
    	const change_handler = todo => toggleCompletion(todo.id, !todo.completed);
    	const click_handler = todo => startEditing(todo.id);
    	const click_handler_1 = todo => deleteTodo(todo.id);

    	$$self.$capture_state = () => ({
    		todos,
    		title,
    		noteContent,
    		editingTodo,
    		handleSubmit,
    		resetForm,
    		fetchTodos,
    		deleteTodo,
    		updateNote,
    		toggleCompletion,
    		startEditing,
    		cancelEditing
    	});

    	$$self.$inject_state = $$props => {
    		if ('todos' in $$props) $$invalidate(0, todos = $$props.todos);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('noteContent' in $$props) $$invalidate(2, noteContent = $$props.noteContent);
    		if ('editingTodo' in $$props) $$invalidate(3, editingTodo = $$props.editingTodo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		todos,
    		title,
    		noteContent,
    		editingTodo,
    		handleSubmit,
    		deleteTodo,
    		updateNote,
    		toggleCompletion,
    		startEditing,
    		cancelEditing,
    		input_input_handler,
    		textarea_input_handler,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		submit_handler,
    		change_handler,
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
