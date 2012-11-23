/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

/**
 * @class Ext.ux.desktop.Desktop This is an abstract class that has to be
 *        inherited by every module.
 * @mixin Ext.util.Observable
 * 
 */
Ext.define(
			'Ext.ux.desktop.Window',
			{
					extend : 'Ext.window.Window',
					requires : [ "Ext.ux.desktop.ToolButton", 
					             "Ext.menu.Menu",
					             "Ext.menu.Item",
					             "Ext.form.*",
					             "Ext.LoadMask"],

					/*
					 * This window has to have a reference to the module object
					 * so that it can take its state, or load its state
					 */

					currentState : "",
					loadedObject:null,
					loadMask:null,
					
					initComponent:function(){
						
						var me=this;
						
						me.loadMask = new Ext.LoadMask(me,{msg:"Loading ..."});
						
						me.saveForm = Ext.widget(
								'form',
								{
									layout : {
										type : 'vbox',
										align : 'stretch'
									},
									border : false,
									bodyPadding : 10,

									fieldDefaults : {
										labelAlign : 'top',
										labelWidth : 100,
										labelStyle : 'font-weight:bold'
									},
									defaults : {
										margins : '0 0 10 0'
									},
									items : [
											{
												xtype : 'fieldcontainer',
												fieldLabel : 'State Name',
												labelStyle : 'font-weight:bold;padding:0',
												layout : 'hbox',
												defaultType : 'textfield',

												fieldDefaults : {
													labelAlign : 'top'
												},

												items : [{
															flex : 1,
															name : 'state_name',
															allowBlank : false
														}]
											}],

									buttons : [
											{
												text : 'Save',
												handler : me.oprSaveAsAppState,
												scope: me
											},   
											{
												text : 'Cancel',
												handler : function() {
													me.saveForm.getForm().reset();						
													me.saveWindow.hide();
												},
												scope: me
											}
											 ]
								});
						
						me.saveWindow = Ext.create('widget.window', {
							height : 200,
							width : 500,
							title : 'Save state',
							layout : 'fit',
							modal: true,
							items : me.saveForm
						});
						
						
						
						me.callParent();
						
						
					},
					
					setLoadedObject:function(loadedObject){
						
						var me = this;
						
						me.loadedObject=loadedObject;
						
						if(me.currentState == ""){
							
							me.title = me.loadedObject.launcher.text+" [Untitled]";
							
						}
						
						me.appClassName = me.loadedObject.self.getName();
						
						me.iconCls = me.loadedObject.launcher.iconCls;
						
					},
					
					getAppClassName: function(){
						
						return this.appClassName;
						
					},
					
					addTools : function() {

						var me = this;
						me.statesMenu = new Ext.menu.Menu();
						
						/*
						 * if the cache for the state of the started application exist
						 */
						if(me.appClassName in me.loadedObject.app.getDesktop().cache.windows){
							
							for (var stateName in me.loadedObject.app.getDesktop().cache.windows[me.appClassName]) {	
								
								var newItem = Ext.create('Ext.menu.Item', {
					    			  text: stateName,
					    			  handler: Ext.bind(me.oprLoadAppState, me, [stateName], false),
					    			  scope:me
					    		});
	
								me.statesMenu.add(newItem);
								
							}
													
						}else{
							
							/*
							 * if the cache does not exist
							 */
							
							Ext.Ajax.request({
							    url: 'up/listAppState',
							    params: {
							        app: 	me.appClassName,
							        obj: 	"application"
							    },
							    scope:me,
							    success: function(response){
							    	
							    	var me = this;
							    	var states = Ext.JSON.decode(response.responseText);
							    	me.loadedObject.app.getDesktop().cache.windows[me.appClassName]={};
							    	
							    	for (var stateName in states) {	
							    		
							    		var newItem = Ext.create('Ext.menu.Item', {
														    			  text: stateName,
														    			  handler: Ext.bind(me.oprLoadAppState, me, [stateName], false),
														    			  scope:me
														    		});
							    		
							    		me.statesMenu.add(newItem);
							    		
							    		me.loadedObject.app.getDesktop().cache.windows[me.appClassName][stateName]=states[stateName];
							    		
							    	}
							    	
							    	
							    }
							});

							
						}
												
						var mainMenu = new Ext.menu.Menu({
							items : [ {
								text : "Load state",
								iconCls : "toolbar-other-load",
								menu : me.statesMenu
							}, {
								text : "Save",
								iconCls : "toolbar-other-save",
								handler:me.oprSaveAppState,
								scope: me
							},{
								text : "Save As ...",
								iconCls : "toolbar-other-save",
								handler : me.formSaveState,
								scope: me
							},{
								text : "Manage states ...",
								iconCls : "toolbar-other-manage"
							} ]
						});

						me.addTool({
							xtype : "toolButton",
							type : "save",
							menu : mainMenu
						});

						me.callParent();

					},
					
					addNewState: function(stateName){
						
						var me = this;
						
						var newItem = Ext.create('Ext.menu.Item', {
			    			  text: stateName,
			    			  handler: Ext.bind(me.oprLoadAppState, me, [stateName], false),
			    			  scope:me
			    		});

						me.statesMenu.add(newItem);
						
					},
					
					formSaveState : function() {
						
						var me = this;
						me.saveForm.getForm().reset();						
						me.saveWindow.show();

					},

					oprSaveAsAppState : function() {
						
						var me = this;
												
						if (me.saveForm.getForm().isValid()) {
							
							var stateName = me.saveForm.getForm().findField("state_name").getValue();
							
							if(!me.isExistingState(stateName)){
								
								me.oprSendDataForSave(stateName,true);
								
							}else{
								
								Ext.MessageBox.alert('Message','State name already exists !');
								
							}
							
						}
						
					},
					
					isExistingState:function(stateName){
						var me = this;

						if( stateName in me.loadedObject.app.getDesktop().cache.windows[me.appClassName])
							return true;
						else
							return false;
						
					},
					oprSaveAppState : function() {
						
						var me = this;
						
						if(me.currentState == ""){
							
							me.formSaveState();
							
						}else{
							
							me.oprSendDataForSave(me.currentState,false);
						}
					},
					
					oprSendDataForSave: function (stateName,isNewItem){
						
						var me = this;
						
						var sendData = me.loadedObject.getStateData();
						/*
						 * We save those data in the database
						 */
						if(!Ext.isObject(sendData)){
							/*
							 * Here the data to be sent is not an object
							 */	
							return;
						}
						
						Ext.Ajax.request({
						    url: 'up/saveAppState',
						    params: {
						        app: 	me.appClassName,
						        name: 	stateName,
						        state: 	Ext.JSON.encode(sendData),
						        obj: "application"
						    },
						    scope:me,
						    success: function(response){
						    	var me = this;
						    	Ext.MessageBox.alert('Message','State saved successfully !');
						    	if(isNewItem)
						    		me.loadedObject.app.getDesktop().addStateToExistingWindows(stateName,me.appClassName,sendData);
						    	else
						    		me.loadedObject.app.getDesktop().cache.windows[me.appClassName][stateName]=sendData;
						    	me.saveForm.getForm().reset();
						    	me.currentState = stateName;
								me.setTitle(me.loadedObject.launcher.text+" ["+me.currentState+"]");
								me.saveWindow.hide();
						    }
						});
						
					},

					oprLoadAppState : function(stateName) {
						
						var me = this;
						
						me.loadMask.show();
						
						me.loadedObject.loadState(me.loadedObject.app.getDesktop().cache.windows[me.appClassName][stateName]);
						me.currentState = stateName;
						me.setTitle(me.loadedObject.launcher.text+" ["+stateName+"]");
						me.loadMask.hide();
						
//						Ext.Ajax.request({
//						    url: 'up/loadAppState',
//						    params: {
//						        app: 	me.appClassName,
//						        name:	stateName,
//						        obj: "application"
//						    },
//						    scope:me,
//						    success: function(response){
//						    	var me = this;
//						    	me.loadedObject.loadState(Ext.JSON.decode(response.responseText));
//								me.currentState = stateName;
//								me.setTitle(me.loadedObject.launcher.text+" ["+stateName+"]");
//								me.loadMask.hide();
//						    }
//						});

					},

					formManageStates : function() {

					}

				});
