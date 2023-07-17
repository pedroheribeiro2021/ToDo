
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
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
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
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    // (294:10) {:else}
    function create_else_block(ctx) {
    	let h3;
    	let t0_value = /*todo*/ ctx[22].title + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = /*todo*/ ctx[22].noteContent + "";
    	let t2;
    	let t3;
    	let div;
    	let button0;
    	let t5;
    	let button1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[16](/*todo*/ ctx[22]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[17](/*todo*/ ctx[22]);
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Editar";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Excluir";
    			attr_dev(h3, "class", "svelte-n10lkb");
    			toggle_class(h3, "completed", /*todo*/ ctx[22].completed);
    			add_location(h3, file, 294, 12, 7540);
    			attr_dev(p, "class", "svelte-n10lkb");
    			toggle_class(p, "completed", /*todo*/ ctx[22].completed);
    			add_location(p, file, 295, 12, 7608);
    			attr_dev(button0, "class", "btn svelte-n10lkb");
    			add_location(button0, file, 297, 14, 7723);
    			attr_dev(button1, "class", "btn svelte-n10lkb");
    			add_location(button1, file, 298, 14, 7813);
    			attr_dev(div, "class", "container-btn svelte-n10lkb");
    			add_location(div, file, 296, 12, 7680);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t5);
    			append_dev(div, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler, false, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*todos*/ 1 && t0_value !== (t0_value = /*todo*/ ctx[22].title + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todos*/ 1) {
    				toggle_class(h3, "completed", /*todo*/ ctx[22].completed);
    			}

    			if (dirty & /*todos*/ 1 && t2_value !== (t2_value = /*todo*/ ctx[22].noteContent + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*todos*/ 1) {
    				toggle_class(p, "completed", /*todo*/ ctx[22].completed);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(294:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (277:10) {#if editingTodo && editingTodo.id === todo.id}
    function create_if_block(ctx) {
    	let form;
    	let label0;
    	let input0;
    	let t0;
    	let label1;
    	let input1;
    	let t1;
    	let div1;
    	let div0;
    	let input2;
    	let input2_checked_value;
    	let t2;
    	let label2;
    	let t4;
    	let button0;
    	let t6;
    	let button1;
    	let mounted;
    	let dispose;

    	function change_handler() {
    		return /*change_handler*/ ctx[14](/*todo*/ ctx[22]);
    	}

    	function submit_handler() {
    		return /*submit_handler*/ ctx[15](/*todo*/ ctx[22]);
    	}

    	const block = {
    		c: function create() {
    			form = element("form");
    			label0 = element("label");
    			input0 = element("input");
    			t0 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			input2 = element("input");
    			t2 = space();
    			label2 = element("label");
    			label2.textContent = "Concluir";
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "Atualizar";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Cancelar";
    			attr_dev(input0, "class", "svelte-n10lkb");
    			add_location(input0, file, 279, 16, 6791);
    			add_location(label0, file, 278, 14, 6766);
    			attr_dev(input1, "class", "svelte-n10lkb");
    			add_location(input1, file, 282, 16, 6896);
    			add_location(label1, file, 281, 14, 6871);
    			attr_dev(input2, "class", "box svelte-n10lkb");
    			attr_dev(input2, "type", "checkbox");
    			input2.checked = input2_checked_value = /*editingTodo*/ ctx[3].completed;
    			add_location(input2, file, 286, 18, 7070);
    			attr_dev(label2, "for", "completed");
    			add_location(label2, file, 287, 18, 7227);
    			attr_dev(div0, "class", "checkBoxk svelte-n10lkb");
    			add_location(div0, file, 285, 16, 7027);
    			attr_dev(button0, "class", "btn edit svelte-n10lkb");
    			attr_dev(button0, "type", "submit");
    			add_location(button0, file, 289, 16, 7308);
    			attr_dev(button1, "class", "btn edit svelte-n10lkb");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file, 290, 16, 7383);
    			attr_dev(div1, "class", "container-btn svelte-n10lkb");
    			add_location(div1, file, 284, 14, 6982);
    			attr_dev(form, "class", "svelte-n10lkb");
    			add_location(form, file, 277, 12, 6647);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, label0);
    			append_dev(label0, input0);
    			set_input_value(input0, /*editingTodo*/ ctx[3].title);
    			append_dev(form, t0);
    			append_dev(form, label1);
    			append_dev(label1, input1);
    			set_input_value(input1, /*editingTodo*/ ctx[3].noteContent);
    			append_dev(form, t1);
    			append_dev(form, div1);
    			append_dev(div1, div0);
    			append_dev(div0, input2);
    			append_dev(div0, t2);
    			append_dev(div0, label2);
    			append_dev(div1, t4);
    			append_dev(div1, button0);
    			append_dev(div1, t6);
    			append_dev(div1, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[12]),
    					listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[13]),
    					listen_dev(input2, "change", change_handler, false, false, false, false),
    					listen_dev(button1, "click", /*cancelEditing*/ ctx[9], false, false, false, false),
    					listen_dev(form, "submit", prevent_default(submit_handler), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*editingTodo*/ 8 && input0.value !== /*editingTodo*/ ctx[3].title) {
    				set_input_value(input0, /*editingTodo*/ ctx[3].title);
    			}

    			if (dirty & /*editingTodo*/ 8 && input1.value !== /*editingTodo*/ ctx[3].noteContent) {
    				set_input_value(input1, /*editingTodo*/ ctx[3].noteContent);
    			}

    			if (dirty & /*editingTodo*/ 8 && input2_checked_value !== (input2_checked_value = /*editingTodo*/ ctx[3].completed)) {
    				prop_dev(input2, "checked", input2_checked_value);
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
    		source: "(277:10) {#if editingTodo && editingTodo.id === todo.id}",
    		ctx
    	});

    	return block;
    }

    // (275:6) {#each todos.filter(todo => !todo.completed) as todo}
    function create_each_block_1(ctx) {
    	let li;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*editingTodo*/ ctx[3] && /*editingTodo*/ ctx[3].id === /*todo*/ ctx[22].id) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if_block.c();
    			t = space();
    			attr_dev(li, "class", "svelte-n10lkb");
    			add_location(li, file, 275, 8, 6570);
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
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(275:6) {#each todos.filter(todo => !todo.completed) as todo}",
    		ctx
    	});

    	return block;
    }

    // (314:6) {#each todos.filter(todo => todo.completed) as todo}
    function create_each_block(ctx) {
    	let li;
    	let div0;
    	let input;
    	let input_checked_value;
    	let t0;
    	let label;
    	let t2;
    	let h3;
    	let t3_value = /*todo*/ ctx[22].title + "";
    	let t3;
    	let t4;
    	let p;
    	let t5_value = /*todo*/ ctx[22].noteContent + "";
    	let t5;
    	let t6;
    	let div1;
    	let button;
    	let t8;
    	let mounted;
    	let dispose;

    	function change_handler_1() {
    		return /*change_handler_1*/ ctx[18](/*todo*/ ctx[22]);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[19](/*todo*/ ctx[22]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
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
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "Excluir";
    			t8 = space();
    			attr_dev(input, "class", "box svelte-n10lkb");
    			attr_dev(input, "type", "checkbox");
    			input.checked = input_checked_value = /*todo*/ ctx[22].completed;
    			add_location(input, file, 316, 12, 8582);
    			attr_dev(label, "for", "completed");
    			add_location(label, file, 317, 12, 8719);
    			attr_dev(div0, "class", "checkBoxk completed svelte-n10lkb");
    			add_location(div0, file, 315, 10, 8535);
    			attr_dev(h3, "class", "svelte-n10lkb");
    			toggle_class(h3, "completed", /*todo*/ ctx[22].completed);
    			add_location(h3, file, 319, 10, 8789);
    			attr_dev(p, "class", "svelte-n10lkb");
    			toggle_class(p, "completed", /*todo*/ ctx[22].completed);
    			add_location(p, file, 320, 10, 8855);
    			attr_dev(button, "class", "btn svelte-n10lkb");
    			add_location(button, file, 322, 12, 8966);
    			attr_dev(div1, "class", "container-btn svelte-n10lkb");
    			add_location(div1, file, 321, 10, 8925);
    			attr_dev(li, "class", "svelte-n10lkb");
    			add_location(li, file, 314, 8, 8519);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div0);
    			append_dev(div0, input);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(li, t2);
    			append_dev(li, h3);
    			append_dev(h3, t3);
    			append_dev(li, t4);
    			append_dev(li, p);
    			append_dev(p, t5);
    			append_dev(li, t6);
    			append_dev(li, div1);
    			append_dev(div1, button);
    			append_dev(li, t8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", change_handler_1, false, false, false, false),
    					listen_dev(button, "click", click_handler_2, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*todos*/ 1 && input_checked_value !== (input_checked_value = /*todo*/ ctx[22].completed)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*todos*/ 1 && t3_value !== (t3_value = /*todo*/ ctx[22].title + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*todos*/ 1) {
    				toggle_class(h3, "completed", /*todo*/ ctx[22].completed);
    			}

    			if (dirty & /*todos*/ 1 && t5_value !== (t5_value = /*todo*/ ctx[22].noteContent + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*todos*/ 1) {
    				toggle_class(p, "completed", /*todo*/ ctx[22].completed);
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
    		source: "(314:6) {#each todos.filter(todo => todo.completed) as todo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let svg0;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let t1;
    	let section0;
    	let form;
    	let div0;
    	let input0;
    	let t2;
    	let div1;
    	let input1;
    	let t3;
    	let div2;
    	let button;
    	let t5;
    	let section1;
    	let h20;
    	let t6;
    	let svg1;
    	let path4;
    	let path5;
    	let t7;
    	let ul0;
    	let t8;
    	let section2;
    	let h21;
    	let t9;
    	let svg2;
    	let path6;
    	let path7;
    	let path8;
    	let t10;
    	let ul1;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*todos*/ ctx[0].filter(func);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*todos*/ ctx[0].filter(func_1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text("Lista de Tarefas ");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			t1 = space();
    			section0 = element("section");
    			form = element("form");
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t3 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Salvar";
    			t5 = space();
    			section1 = element("section");
    			h20 = element("h2");
    			t6 = text("Tarefas Pendentes ");
    			svg1 = svg_element("svg");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			t7 = space();
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t8 = space();
    			section2 = element("section");
    			h21 = element("h2");
    			t9 = text("Tarefas Concluídas ");
    			svg2 = svg_element("svg");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			t10 = space();
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(path0, "stroke", "none");
    			attr_dev(path0, "d", "M0 0h24v24H0z");
    			attr_dev(path0, "fill", "none");
    			add_location(path0, file, 249, 4, 5334);
    			attr_dev(path1, "d", "M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2");
    			add_location(path1, file, 250, 4, 5397);
    			attr_dev(path2, "d", "M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z");
    			add_location(path2, file, 251, 4, 5501);
    			attr_dev(path3, "d", "M9 14l2 2l4 -4");
    			add_location(path3, file, 252, 4, 5601);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "class", "icon icon-tabler icon-tabler-clipboard-check");
    			attr_dev(svg0, "width", "40");
    			attr_dev(svg0, "height", "40");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke-width", "2");
    			attr_dev(svg0, "stroke", "currentColor");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "stroke-linecap", "round");
    			attr_dev(svg0, "stroke-linejoin", "round");
    			add_location(svg0, file, 248, 23, 5094);
    			add_location(h1, file, 248, 2, 5073);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Título");
    			attr_dev(input0, "class", "svelte-n10lkb");
    			add_location(input0, file, 257, 8, 5754);
    			add_location(div0, file, 256, 6, 5739);
    			attr_dev(input1, "placeholder", "Crie uma nota..");
    			attr_dev(input1, "class", "svelte-n10lkb");
    			add_location(input1, file, 260, 8, 5852);
    			add_location(div1, file, 259, 6, 5837);
    			attr_dev(button, "class", "btn svelte-n10lkb");
    			attr_dev(button, "id", "save");
    			attr_dev(button, "type", "submit");
    			add_location(button, file, 263, 8, 5975);
    			attr_dev(div2, "class", "container-btn svelte-n10lkb");
    			add_location(div2, file, 262, 6, 5938);
    			attr_dev(form, "class", "svelte-n10lkb");
    			add_location(form, file, 255, 4, 5685);
    			attr_dev(section0, "class", "todo_form svelte-n10lkb");
    			add_location(section0, file, 254, 2, 5652);
    			attr_dev(path4, "stroke", "none");
    			attr_dev(path4, "d", "M0 0h24v24H0z");
    			attr_dev(path4, "fill", "none");
    			add_location(path4, file, 270, 6, 6374);
    			attr_dev(path5, "d", "M5 12l5 5l10 -10");
    			add_location(path5, file, 271, 6, 6439);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "icon icon-tabler icon-tabler-check");
    			attr_dev(svg1, "width", "24");
    			attr_dev(svg1, "height", "24");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke-width", "2");
    			attr_dev(svg1, "stroke", "currentColor");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "stroke-linecap", "round");
    			attr_dev(svg1, "stroke-linejoin", "round");
    			add_location(svg1, file, 269, 26, 6142);
    			add_location(h20, file, 269, 4, 6120);
    			attr_dev(ul0, "class", "svelte-n10lkb");
    			add_location(ul0, file, 273, 4, 6495);
    			attr_dev(section1, "class", "container-notes svelte-n10lkb");
    			add_location(section1, file, 268, 2, 6081);
    			attr_dev(path6, "stroke", "none");
    			attr_dev(path6, "d", "M0 0h24v24H0z");
    			attr_dev(path6, "fill", "none");
    			add_location(path6, file, 308, 6, 8279);
    			attr_dev(path7, "d", "M7 12l5 5l10 -10");
    			add_location(path7, file, 309, 6, 8344);
    			attr_dev(path8, "d", "M2 12l5 5m5 -5l5 -5");
    			add_location(path8, file, 310, 6, 8386);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "class", "icon icon-tabler icon-tabler-checks");
    			attr_dev(svg2, "width", "24");
    			attr_dev(svg2, "height", "24");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke-width", "2");
    			attr_dev(svg2, "stroke", "currentColor");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "stroke-linecap", "round");
    			attr_dev(svg2, "stroke-linejoin", "round");
    			add_location(svg2, file, 307, 27, 8046);
    			add_location(h21, file, 307, 4, 8023);
    			attr_dev(ul1, "class", "svelte-n10lkb");
    			add_location(ul1, file, 312, 4, 8445);
    			attr_dev(section2, "class", "container-notes svelte-n10lkb");
    			add_location(section2, file, 306, 2, 7984);
    			attr_dev(main, "class", "svelte-n10lkb");
    			add_location(main, file, 247, 0, 5063);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(h1, svg0);
    			append_dev(svg0, path0);
    			append_dev(svg0, path1);
    			append_dev(svg0, path2);
    			append_dev(svg0, path3);
    			append_dev(main, t1);
    			append_dev(main, section0);
    			append_dev(section0, form);
    			append_dev(form, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*title*/ ctx[1]);
    			append_dev(form, t2);
    			append_dev(form, div1);
    			append_dev(div1, input1);
    			set_input_value(input1, /*noteContent*/ ctx[2]);
    			append_dev(form, t3);
    			append_dev(form, div2);
    			append_dev(div2, button);
    			append_dev(main, t5);
    			append_dev(main, section1);
    			append_dev(section1, h20);
    			append_dev(h20, t6);
    			append_dev(h20, svg1);
    			append_dev(svg1, path4);
    			append_dev(svg1, path5);
    			append_dev(section1, t7);
    			append_dev(section1, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(ul0, null);
    				}
    			}

    			append_dev(main, t8);
    			append_dev(main, section2);
    			append_dev(section2, h21);
    			append_dev(h21, t9);
    			append_dev(h21, svg2);
    			append_dev(svg2, path6);
    			append_dev(svg2, path7);
    			append_dev(svg2, path8);
    			append_dev(section2, t10);
    			append_dev(section2, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul1, null);
    				}
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[10]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[11]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[4]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 2 && input0.value !== /*title*/ ctx[1]) {
    				set_input_value(input0, /*title*/ ctx[1]);
    			}

    			if (dirty & /*noteContent*/ 4 && input1.value !== /*noteContent*/ ctx[2]) {
    				set_input_value(input1, /*noteContent*/ ctx[2]);
    			}

    			if (dirty & /*updateNote, todos, editingTodo, cancelEditing, toggleCompletion, deleteTodo, startEditing*/ 1001) {
    				each_value_1 = /*todos*/ ctx[0].filter(func);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*deleteTodo, todos, toggleCompletion*/ 161) {
    				each_value = /*todos*/ ctx[0].filter(func_1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
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
    			destroy_each(each_blocks_1, detaching);
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

    const func = todo => !todo.completed;
    const func_1 = todo => todo.completed;

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
    		}
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
    		}
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
    		}
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
    					return {
    						...todo,
    						completed: updatedTodo.completed
    					};
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

    	function input0_input_handler() {
    		title = this.value;
    		$$invalidate(1, title);
    	}

    	function input1_input_handler() {
    		noteContent = this.value;
    		$$invalidate(2, noteContent);
    	}

    	function input0_input_handler_1() {
    		editingTodo.title = this.value;
    		$$invalidate(3, editingTodo);
    	}

    	function input1_input_handler_1() {
    		editingTodo.noteContent = this.value;
    		$$invalidate(3, editingTodo);
    	}

    	const change_handler = todo => toggleCompletion(todo.id, !editingTodo.completed);
    	const submit_handler = todo => updateNote(todo.id, editingTodo.title, editingTodo.noteContent);
    	const click_handler = todo => startEditing(todo.id);
    	const click_handler_1 = todo => deleteTodo(todo.id);
    	const change_handler_1 = todo => toggleCompletion(todo.id, !todo.completed);
    	const click_handler_2 = todo => deleteTodo(todo.id);

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
    		input0_input_handler,
    		input1_input_handler,
    		input0_input_handler_1,
    		input1_input_handler_1,
    		change_handler,
    		submit_handler,
    		click_handler,
    		click_handler_1,
    		change_handler_1,
    		click_handler_2
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
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
