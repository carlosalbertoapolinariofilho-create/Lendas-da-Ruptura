extends Node3D
## Pré-alfa 3D para desktop/Android, conectada por WebSocket a servidor autoritativo.
## Visual procedural de teste: não é arte 3D de produção.

const HEROES = {
	"aster": {"name": "Aster | Tanque", "color": Color("e4aa49")},
	"nyra": {"name": "Nyra | Assassina", "color": Color("a590ff")},
	"kael": {"name": "Kael | Atirador", "color": Color("e56a5f")},
	"lyra": {"name": "Lyra | Maga", "color": Color("70c4ef")},
	"orion": {"name": "Orion | Lutador", "color": Color("7ccc98")},
	"selene": {"name": "Selene | Suporte", "color": Color("f6b1df")}
}
const W = 56.0
const H = 34.0

var ws: WebSocketPeer = WebSocketPeer.new()
var server_connected := false
var attempted := false
var in_match := false
var local_training := false
var account_id := ""
var stored_token := ""
var own_team := 0
var selected_hero := "aster"
var queue_mode := "casual"
var move_axis := Vector2.ZERO
var touch_pointer := -1
var touch_origin := Vector2.ZERO
var send_accumulator := 0.0
var local_time := 0.0
var local_hp := 220.0
var player_position := Vector3(-22, 1, 0)
var camera: Camera3D
var visuals := {}
var current_snapshot := {}
var hp_label: Label
var status_label: Label
var mmr_label: Label
var server_address: LineEdit
var nickname_field: LineEdit
var hero_dropdown: OptionButton
var matchmaking_panel: HBoxContainer
var launcher_panel: HBoxContainer
var hud_panel: HBoxContainer
var training_bots: Array = []
var touch_active := false

func _ready() -> void:
	_build_world()
	_build_ui()
	_set_status("Arena 3D carregada. Experimente Treino Offline ou conecte um servidor.")

func _physics_process(delta: float) -> void:
	var keys := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var desired: Vector2 = move_axis if move_axis.length() > 0.04 else keys
	if desired.length() > 1.0:
		desired = desired.normalized()
	if local_training:
		local_time += delta
		player_position.x = clampf(player_position.x + desired.x * 5.4 * delta, -27.5, 27.5)
		player_position.z = clampf(player_position.z + desired.y * 5.4 * delta, -16.5, 16.5)
		_update_local_training(delta)
	elif server_connected and in_match:
		send_accumulator += delta
		if send_accumulator >= 0.095:
			send_accumulator = 0
			_send({"type": "input", "x": desired.x, "z": desired.y})
	if camera:
		var target := player_position + Vector3(0, 25, 22)
		camera.global_position = camera.global_position.lerp(target, minf(delta * 4, 1.0))
		camera.look_at(player_position - Vector3(0, 0.6, 0))
	if Input.is_action_just_pressed("attack"):
		_combat(0)
	if Input.is_action_just_pressed("ability_one"):
		_combat(1)
	if Input.is_action_just_pressed("ability_two"):
		_combat(2)
	if Input.is_action_just_pressed("ability_three"):
		_combat(3)

func _process(_delta: float) -> void:
	if not attempted:
		return
	ws.poll()
	var state := ws.get_ready_state()
	if state == WebSocketPeer.STATE_OPEN:
		if not server_connected:
			server_connected = true
			_set_status("Conectado ao servidor. Autenticando perfil...")
			if account_id != "" and stored_token != "":
				_send({"type": "login", "id": account_id, "token": stored_token})
			else:
				_send({"type": "register", "nickname": nickname_field.text})
		while ws.get_available_packet_count() > 0:
			var parsed = JSON.parse_string(ws.get_packet().get_string_from_utf8())
			if parsed is Dictionary:
				_receive(parsed)
	elif state == WebSocketPeer.STATE_CLOSED:
		if server_connected or attempted:
			server_connected = false
			in_match = false
			attempted = false
			_set_status("Desconectado. Verifique o endereço do servidor e a rede.")

func _connect() -> void:
	if local_training:
		_stop_training()
	var url := server_address.text.strip_edges()
	if not (url.begins_with("ws://") or url.begins_with("wss://")):
		_set_status("Use ws://IP:8080/ws em rede local ou wss:// em servidor público.")
		return
	attempted = true
	server_connected = false
	ws = WebSocketPeer.new()
	var err := ws.connect_to_url(url)
	if err != OK:
		attempted = false
		_set_status("Falha na conexão: %d" % err)
	else:
		_set_status("Conectando ao servidor de jogo...")

func _send(packet: Dictionary) -> void:
	if ws.get_ready_state() == WebSocketPeer.STATE_OPEN:
		ws.send_text(JSON.stringify(packet))

func _receive(packet: Dictionary) -> void:
	match str(packet.get("type", "")):
		"auth":
			var p: Dictionary = packet.get("profile", {})
			account_id = str(p.get("id", ""))
			if packet.has("token"):
				stored_token = str(packet.get("token", ""))
				var config := ConfigFile.new()
				config.set_value("perfil", "id", account_id)
				config.set_value("perfil", "token", stored_token)
				config.save("user://conta.cfg")
			mmr_label.text = "Liga: %s  |  MMR teste: %s" % [str(p.get("tier", "Prata")), str(p.get("mmr", 1000))]
			_set_status("Perfil ativo: %s. Escolha o herói e busque uma partida." % str(p.get("nickname", "Jogador")))
		"match_found":
			in_match = true
			own_team = int(packet.get("team", 0))
			launcher_panel.visible = false
			matchmaking_panel.visible = false
			hud_panel.visible = true
			_set_status("Partida %s • Time %d • %s" % [str(packet.get("matchId", "")), own_team + 1, str(packet.get("notice", ""))])
		"snapshot":
			current_snapshot = packet
			_render_snapshot(packet)
		"match_result":
			in_match = false
			hud_panel.visible = false
			launcher_panel.visible = true
			matchmaking_panel.visible = true
			var msg := "Empate" if packet.get("won") == null else ("Vitória!" if bool(packet.get("won")) else "Derrota")
			var p: Dictionary = packet.get("profile", {})
			mmr_label.text = "Liga: %s  |  MMR teste: %s" % [str(p.get("tier", "")), str(p.get("mmr", ""))]
			_set_status("Partida encerrada: %s" % msg)
		"queued":
			_set_status("Fila %s. Aguardando outro jogador (pré-alfa 1x1)." % str(packet.get("mode", "casual")))
		"queue_cancelled":
			_set_status("Busca cancelada.")
		"error":
			_set_status("Servidor: %s" % str(packet.get("message", "erro")))
		"selected":
			_set_status("Herói escolhido: %s" % str(packet.get("hero", "")))

func _queue(mode: String) -> void:
	if not server_connected:
		_set_status("Conecte-se ao servidor antes de buscar uma partida.")
		return
	if in_match:
		return
	local_training = false
	queue_mode = mode
	_send({"type": "select_hero", "hero": selected_hero})
	_send({"type": "queue", "mode": mode})

func _combat(slot: int) -> void:
	if local_training:
		if slot == 2:
			player_position.x = clampf(player_position.x + 3.2, -27.5, 27.5)
		elif slot == 3:
			local_hp = minf(220.0, local_hp + 55.0)
		else:
			for bot in training_bots:
				if bot["hp"] > 0 and bot["position"].distance_to(player_position) < (7.0 if slot == 1 else 4.5):
					bot["hp"] -= (55.0 if slot == 1 else 26.0)
					break
	elif server_connected and in_match:
		_send({"type": "attack", "slot": slot})

func _render_snapshot(packet: Dictionary) -> void:
	var used := {}
	for group in ["players", "minions", "structures"]:
		for obj in packet.get(group, []):
			if not (obj is Dictionary):
				continue
			var key: String = group + ":" + str(obj.get("id", ""))
			used[key] = true
			if not visuals.has(key):
				visuals[key] = _create_actor(obj, group)
			var actor: Node3D = visuals[key]
			actor.position = Vector3(float(obj.get("x", 0)), (1.0 if group == "players" else 0.7), float(obj.get("z", 0)))
			actor.visible = int(obj.get("hp", 0)) > 0
			if group == "players" and str(obj.get("id", "")) == account_id:
				player_position = actor.position
				hp_label.text = "PV: %s/%s | Eliminações: %s | Ouro: %s" % [str(obj.get("hp", 0)), str(obj.get("maxHp", 0)), str(obj.get("kills", 0)), str(obj.get("gold", 0))]
	for key in visuals.keys():
		if not used.has(key):
			visuals[key].queue_free()
			visuals.erase(key)

func _start_training() -> void:
	if attempted:
		ws.close()
		attempted = false
		server_connected = false
	in_match = false
	local_training = true
	launcher_panel.visible = false
	matchmaking_panel.visible = false
	hud_panel.visible = true
	player_position = Vector3(-21, 1, 0)
	local_hp = 220.0
	local_time = 0.0
	training_bots.clear()
	_clear_actors()
	var hero_data := {"id":"training_player", "hero":selected_hero, "team":0, "nickname":"Você", "hp":220, "maxHp":220}
	visuals["local_player"] = _create_actor(hero_data, "players")
	for i in range(6):
		var bot_data := {"id":i, "hero": "nyra" if i%2==0 else "aster", "team":1, "nickname":"Treino", "hp":85, "maxHp":85}
		var actor := _create_actor(bot_data, "minions")
		training_bots.append({"node":actor,"position":Vector3(2+i*3,0.7,-10+(i%3)*10),"hp":85.0})
	_set_status("Treino 3D offline: mova com WASD/joystick e ataque com os botões. Gráficos provisórios.")

func _update_local_training(dt: float) -> void:
	if visuals.has("local_player"):
		visuals["local_player"].position = player_position
	var left := 0
	for bot in training_bots:
		if bot["hp"] <= 0.0:
			bot["node"].visible = false
			continue
		left += 1
		var pos: Vector3 = bot["position"]
		var target: Vector3 = player_position
		var vec: Vector3 = target - pos
		if vec.length() > 1.7:
			pos += vec.normalized() * dt * 1.65
		bot["position"] = pos
		bot["node"].position = pos
		if vec.length() < 2.2 and sin(local_time*3.5) > 0.965:
			local_hp = maxf(0.0, local_hp - 4.0)
	if local_hp <= 0.0:
		local_hp = 220.0
		player_position = Vector3(-21,1,0)
	hp_label.text = "PV: %d/220  |  Alvos restantes: %d" % [int(local_hp), left]
	if left == 0:
		_set_status("Treino concluído! Todos os alvos derrotados.")

func _stop_training() -> void:
	if not local_training:
		_set_status("A saída da partida online será tratada pelo servidor em uma próxima versão.")
		return
	local_training = false
	_clear_actors()
	hud_panel.visible = false
	launcher_panel.visible = true
	matchmaking_panel.visible = true
	_set_status("Treino finalizado.")

func _clear_actors() -> void:
	for actor in visuals.values():
		actor.queue_free()
	visuals.clear()
	for bot in training_bots:
		if is_instance_valid(bot.get("node")):
			bot["node"].queue_free()
	training_bots.clear()

func _create_actor(obj: Dictionary, group: String) -> Node3D:
	var actor := Node3D.new()
	add_child(actor)
	var team := int(obj.get("team", 0))
	var c := Color("418eea") if team == 0 else Color("fa4a70")
	if group == "players":
		var hero: Dictionary = HEROES.get(str(obj.get("hero", "aster")), HEROES["aster"])
		_add_mesh(actor, CapsuleMesh.new(), Vector3(0,0,0), hero["color"], Vector3(0.78,1.2,0.78))
		_add_mesh(actor, SphereMesh.new(), Vector3(0,1.15,0), c, Vector3(0.47,0.47,0.47))
		_add_mesh(actor, BoxMesh.new(), Vector3(0.72,0.12,0), Color("ecf3ff"), Vector3(0.18,1.35,0.28))
		var nameplate := Label3D.new()
		nameplate.text = str(obj.get("nickname", "Herói"))
		nameplate.position = Vector3(0,1.95,0)
		nameplate.pixel_size = 0.01
		nameplate.font_size = 24
		nameplate.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		actor.add_child(nameplate)
	elif group == "minions":
		_add_mesh(actor, SphereMesh.new(), Vector3.ZERO, c, Vector3(0.70,0.70,0.70))
		_add_mesh(actor, BoxMesh.new(), Vector3(0,0.65,0), Color("f4ddab"), Vector3(0.3,0.5,0.3))
	else:
		_add_mesh(actor, CylinderMesh.new(), Vector3.ZERO, c, Vector3(1.5,2.4,1.5))
		_add_mesh(actor, SphereMesh.new(), Vector3(0,1.9,0), Color("f9cc7b") if str(obj.get("kind","")) == "core" else Color("dceaff"), Vector3(1,1,1))
	return actor

func _material(color: Color, emission: bool = false) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.metallic = 0.15
	m.roughness = 0.42
	if emission:
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = 0.7
	return m

func _add_mesh(parent: Node3D, mesh: Mesh, pos: Vector3, tint: Color, scale3: Vector3) -> void:
	var inst := MeshInstance3D.new()
	inst.mesh = mesh
	inst.material_override = _material(tint)
	inst.position = pos
	inst.scale = scale3
	parent.add_child(inst)

func _box(size3: Vector3, location: Vector3, tint: Color) -> void:
	var mesh := BoxMesh.new()
	mesh.size = size3
	_add_mesh(self, mesh, location, tint, Vector3.ONE)

func _build_world() -> void:
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color("101427")
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color("9497b9")
	e.ambient_light_energy = 0.75
	env.environment = e
	add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-50, -20, 0)
	sun.light_energy = 1.3
	add_child(sun)
	_box(Vector3(60,0.5,40),Vector3(0,-0.47,0),Color("23433c"))
	for z in [-11.0, 0.0, 11.0]:
		_box(Vector3(58,0.13,4.0),Vector3(0,-0.18,z),Color("59616b"))
	for x in [-27.0,27.0]:
		_box(Vector3(1.0,2.2,40),Vector3(x,0.7,0),Color("302e45"))
	for z in [-19.0,19.0]:
		_box(Vector3(60,2.2,1),Vector3(0,0.7,z),Color("302e45"))
	_box(Vector3(1.1,0.14,38),Vector3(0,-0.14,0),Color("3e86a0"))
	for team in [0,1]:
		for lane in [-11.0,0.0,11.0]:
			var tower := Node3D.new()
			add_child(tower)
			tower.position = Vector3(-17 if team==0 else 17,0.1,lane)
			_add_mesh(tower, CylinderMesh.new(),Vector3(0,1,0),Color("4388df") if team==0 else Color("e55376"),Vector3(1.2,2.0,1.2))
			_add_mesh(tower, SphereMesh.new(),Vector3(0,2.65,0),Color("e8edff"),Vector3(0.72,0.72,0.72))
		var base := Node3D.new()
		add_child(base)
		base.position = Vector3(-25 if team==0 else 25,0,0)
		_add_mesh(base,CylinderMesh.new(),Vector3(0,1.15,0),Color("468bd3") if team==0 else Color("db4d70"),Vector3(1.6,2.3,1.6))
		_add_mesh(base,SphereMesh.new(),Vector3(0,3.3,0),Color("e9b671"),Vector3(1.2,1.2,1.2))
	for i in range(24):
		var z := -16.0 if i%2==0 else 16.0
		var x := -24.0 + floorf(float(i)/2.0)*4.2
		_box(Vector3(1.8,2.6+float(i%3),1.8),Vector3(x,1.1,z),Color("263e43"))
	camera = Camera3D.new()
	camera.current = true
	camera.fov = 55
	camera.position = Vector3(-22,27,22)
	add_child(camera)
	camera.look_at(player_position)

func _style(bg: Color, border: Color = Color("343b57")) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(1)
	s.set_corner_radius_all(9)
	s.content_margin_left = 12.0
	s.content_margin_right = 12.0
	s.content_margin_top = 9.0
	s.content_margin_bottom = 9.0
	return s

func _button(title: String, action: Callable) -> Button:
	var b := Button.new()
	b.text = title
	b.custom_minimum_size = Vector2(126,46)
	b.add_theme_stylebox_override("normal",_style(Color("292842")))
	b.add_theme_stylebox_override("hover",_style(Color("64344e")))
	b.add_theme_stylebox_override("pressed",_style(Color("ae455c")))
	b.add_theme_color_override("font_color",Color("f6f1ff"))
	b.pressed.connect(action)
	return b

func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_PASS
	layer.add_child(root)
	var top := VBoxContainer.new()
	top.position = Vector2(20,12)
	top.add_theme_constant_override("separation",6)
	root.add_child(top)
	var title := Label.new()
	title.text = "⚔ LENDAS DA RUPTURA  |  ARENA 3D • PRÉ-ALFA"
	title.add_theme_font_size_override("font_size",26)
	title.add_theme_color_override("font_color",Color("f6d3a0"))
	top.add_child(title)
	status_label = Label.new()
	status_label.text = "Iniciando..."
	status_label.custom_minimum_size = Vector2(780,28)
	status_label.add_theme_color_override("font_color",Color("d4d5e8"))
	top.add_child(status_label)
	mmr_label = Label.new()
	mmr_label.text = "Liga: não conectada"
	mmr_label.add_theme_color_override("font_color",Color("ddc27b"))
	top.add_child(mmr_label)
	launcher_panel = HBoxContainer.new()
	launcher_panel.add_theme_constant_override("separation",8)
	top.add_child(launcher_panel)
	server_address = LineEdit.new()
	server_address.text = "ws://127.0.0.1:8080/ws"
	server_address.placeholder_text = "wss://meuservidor.com/ws"
	server_address.custom_minimum_size = Vector2(275,45)
	launcher_panel.add_child(server_address)
	nickname_field = LineEdit.new()
	nickname_field.text = "Guerreiro" + str(randi_range(100,999))
	nickname_field.placeholder_text = "Nome do jogador"
	nickname_field.custom_minimum_size = Vector2(170,45)
	launcher_panel.add_child(nickname_field)
	launcher_panel.add_child(_button("Conectar",_connect))
	launcher_panel.add_child(_button("Treino Offline",_start_training))
	matchmaking_panel = HBoxContainer.new()
	matchmaking_panel.add_theme_constant_override("separation",8)
	top.add_child(matchmaking_panel)
	hero_dropdown = OptionButton.new()
	hero_dropdown.custom_minimum_size = Vector2(225,45)
	for key in HEROES.keys():
		hero_dropdown.add_item(str(HEROES[key]["name"]))
		hero_dropdown.set_item_metadata(hero_dropdown.item_count-1,key)
	hero_dropdown.item_selected.connect(func(idx: int): selected_hero = str(hero_dropdown.get_item_metadata(idx)))
	matchmaking_panel.add_child(hero_dropdown)
	matchmaking_panel.add_child(_button("Batalha 1x1",func(): _queue("casual")))
	matchmaking_panel.add_child(_button("Ranqueada • Teste",func(): _queue("ranked")))
	matchmaking_panel.add_child(_button("Cancelar fila",func(): _send({"type":"cancel_queue"})))
	hud_panel = HBoxContainer.new()
	hud_panel.position = Vector2(20,625)
	hud_panel.add_theme_constant_override("separation",9)
	root.add_child(hud_panel)
	hud_panel.visible = false
	hp_label = Label.new()
	hp_label.custom_minimum_size = Vector2(310,40)
	hp_label.text = "PV: 220/220"
	hp_label.add_theme_font_size_override("font_size",19)
	hud_panel.add_child(hp_label)
	hud_panel.add_child(_button("ATACAR",func(): _combat(0)))
	hud_panel.add_child(_button("Habilidade 1",func(): _combat(1)))
	hud_panel.add_child(_button("Investida 2",func(): _combat(2)))
	hud_panel.add_child(_button("Cura 3",func(): _combat(3)))
	hud_panel.add_child(_button("Sair do treino",_stop_training))
	var mobile_guide := Label.new()
	mobile_guide.text = "Controle: WASD ou arraste o lado esquerdo • espaço/1/2/3 ou botões de combate"
	mobile_guide.position = Vector2(20,598)
	mobile_guide.add_theme_color_override("font_color",Color("c3c4d0"))
	root.add_child(mobile_guide)
	var config := ConfigFile.new()
	if config.load("user://conta.cfg") == OK:
		account_id = str(config.get_value("perfil","id",""))
		stored_token = str(config.get_value("perfil","token",""))

func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and event.position.x < get_viewport().get_visible_rect().size.x*0.43:
			touch_pointer = event.index
			touch_origin = event.position
			touch_active = true
		elif not event.pressed and event.index == touch_pointer:
			touch_pointer = -1
			touch_active = false
			move_axis = Vector2.ZERO
	elif event is InputEventScreenDrag and event.index == touch_pointer:
		move_axis = (event.position-touch_origin)/95.0
		if move_axis.length() > 1.0:
			move_axis = move_axis.normalized()

func _set_status(message: String) -> void:
	if status_label:
		status_label.text = message
