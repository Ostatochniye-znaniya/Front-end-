"use client";

import { useState } from "react";
import { useEffect } from "react";

import Script from "next/script";

import { PieChart, FileText, Users, BookOpen, Settings } from 'lucide-react';

//import "../../legacy_styles/style.css";
//import "../../legacy_styles/recommendation_styles.css";
//import "../../legacy_styles/groups_page_style.css";

export default function LprList() {
    useEffect(() => {
        const API_BASE_URL = '/csh/api/';
        const tableBody = document.getElementById('tableBody');
        const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
        
        const createModal = document.getElementById('createGroupModal');
        const cancelCreateBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
        const createGroupForm = document.getElementById('createGroupForm') as HTMLFormElement;
        const studyProgramSelect = document.getElementById('studyProgram') as HTMLSelectElement;
        const groupNumberInput = document.getElementById('groupNumber') as HTMLInputElement;
        const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
        
        const updateModal = document.getElementById('updateGroupModal');
        const cancelUpdateBtn = document.getElementById('cancelUpdateBtn') as HTMLButtonElement;
        const updateGroupForm = document.getElementById('updateGroupForm') as HTMLFormElement;
        const updateStudyProgramSelect = document.getElementById('updateStudyProgram') as HTMLSelectElement;
        const updateGroupNumberInput = document.getElementById('updateGroupNumber') as HTMLInputElement;
        const updateGroupIdInput = document.getElementById('updateGroupId') as HTMLInputElement;
        const updateBtn = document.getElementById('updateBtn') as HTMLButtonElement;
        
        let studyPrograms:{ id: number, name: string }[] = [];
        let currentGroups = [];
        
        async function loadGroups() {
            try {
                showLoading();
                
                const response = await fetch(`${API_BASE_URL}/StudyGroup/GetAll`);
                
                if (response.ok) {
                    const groups = await response.json();
                    currentGroups = groups;
                    updateTable(groups);
                } else {
                    showNoData();
                }
            } catch (error) {
                console.error('Ошибка загрузки групп:', error);
                showNoData();
            }
        }

        async function loadStudyPrograms() {
            try {
                const response = await fetch(`${API_BASE_URL}/StudyProgram/GetAll`);
                
                if (response.ok) {
                    studyPrograms = await response.json() as { id: number, name: string }[];
                    
                    studyProgramSelect!.innerHTML = '<option class="dropdown-item text" value="">Выберите направление</option>';
                    updateStudyProgramSelect!.innerHTML = '<option class="dropdown-item text" value="">Выберите направление</option>';
                    
                    studyPrograms.forEach(program => {
                        const option1 = document.createElement('option');
                        option1.value = program.id.toString();
                        option1.textContent = program.name;
                        option1.className = "dropdown-item";
                        option1.className += "text";
                        studyProgramSelect!.appendChild(option1);
                        
                        const option2 = document.createElement('option');
                        option2.value = program.id.toString();
                        option2.textContent = program.name;
                        option2.className = "dropdown-item";
                        option2.className += "text";
                        updateStudyProgramSelect!.appendChild(option2);
                    });
                }
            } catch (error) {
                console.error('Ошибка загрузки программ обучения:', error);
                alert('Не удалось загрузить список направлений');
            }
        }
        
        function updateTable(groups) {
            tableBody!.innerHTML = '';
            
            if (!groups || groups.length === 0) {
                showNoData();
                return;
            }
            
            groups.forEach(group => {
                const row = document.createElement('tr');
                
                const groupNumber = group.groupNumber || group.name || '-';
                const programName = group.studyProgram ? group.studyProgram.name : '-';
                const course = calculateCourse(groupNumber);
                const programCypher = group.studyProgram ? group.studyProgram.cypherOfTheDirection : '-';
                const studyProgramId = group.studyProgram ? group.studyProgram.id : (group.studyProgramId || 0);
                
                row.innerHTML = `
                    <td>${groupNumber}</td>
                    <td>${programName}</td>
                    <td>${course}</td>
                    <td>${programCypher}</td>
                    <td>
                        <div class="btn-group">
                            <button class="update-btn btn btn-blue" data-id="${group.id}" 
                                    data-number="${groupNumber}" 
                                    data-program="${studyProgramId}">Обновить</button>
                            <button class="delete-btn btn btn-red" data-id="${group.id}">Удалить</button>
                        </div>
                    </td>
                `;
                
                tableBody!.appendChild(row);
            });
            
            updateRecordsCount(groups.length);
            
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const target = event.target as HTMLButtonElement;
                    const groupId = target.getAttribute('data-id');
                    const groupName = target.closest('tr')!.cells[0].textContent;
                    
                    if (confirm(`Вы уверены, что хотите удалить группу "${groupName}"?`)) {
                        await deleteGroup(groupId);
                    }
                });
            });
            
            document.querySelectorAll('.update-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const target = event.target as HTMLButtonElement;
                    const groupId = target.getAttribute('data-id');
                    const groupNumber = target.getAttribute('data-number');
                    const studyProgramId = target.getAttribute('data-program');
                    
                    openUpdateModal(groupId, groupNumber, studyProgramId);
                });
            });
        }
        
        async function deleteGroup(groupId) {
            try {
                const response = await fetch(`${API_BASE_URL}/StudyGroup/Delete/${groupId}`, {
                    method: 'DELETE',
                });
                
                if (response.ok) {
                    alert('Группа успешно удалена');
                    loadGroups();
                } else {
                    const errorText = await response.text();
                    alert(`Ошибка при удалении группы: ${errorText}`);
                }
            } catch (error) {
                console.error('Ошибка удаления группы:', error);
                alert('Ошибка при удалении группы');
            }
        }
        
        async function createGroup(groupData) {
            try {
                saveBtn!.disabled = true;
                saveBtn!.textContent = 'Создание...';
                
                const response = await fetch(`${API_BASE_URL}/StudyGroup/Create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(groupData)
                });
                
                if (response.ok) {
                    alert('Группа успешно создана');
                    closeCreateModal();
                    loadGroups();
                } else {
                    const errorText = await response.text();
                    alert(`Ошибка при создании группы: ${errorText}`);
                }
            } catch (error) {
                console.error('Ошибка создания группы:', error);
                alert('Ошибка при создании группы');
            } finally {
                saveBtn!.disabled = false;
                saveBtn!.textContent = 'Создать';
            }
        }
        
        async function updateGroup(groupId, groupData) {
            try {
                updateBtn!.disabled = true;
                updateBtn!.textContent = 'Обновление...';
                
                const response = await fetch(`${API_BASE_URL}/StudyGroup/Update/${groupId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(groupData)
                });
                
                if (response.ok) {
                    alert('Группа успешно обновлена');
                    closeUpdateModal();
                    loadGroups();
                } else {
                    const errorText = await response.text();
                    alert(`Ошибка при обновлении группы: ${errorText}`);
                }
            } catch (error) {
                console.error('Ошибка обновления группы:', error);
                alert('Ошибка при обновлении группы');
            } finally {
                updateBtn!.disabled = false;
                updateBtn!.textContent = 'Обновить';
            }
        }
        
        function calculateCourse(groupNumber) {
            if (!groupNumber) return '-';
            
            const parts = groupNumber.split('-');
            if (parts.length < 2) return '-';
            
            const beforeDash = parts[0];
            if (beforeDash.length < 2) return '-';
            
            const lastTwo = beforeDash.slice(-2);
            if (!/^\d{2}$/.test(lastTwo)) return '-';
            
            const admissionYear = 2000 + parseInt(lastTwo);
            const now = new Date();
            const currentYear = now.getFullYear();
            const month = now.getMonth();
            
            const academicYear = month >= 8 ? currentYear : currentYear - 1;
            let course = academicYear - admissionYear;
            
            if (course < 1) return 1;
            if (course > 5) return 5;
            
            return course;
        }
        
        function updateRecordsCount(count) {
            const recordsCountElement = document.getElementById('recordsCount');
            if (recordsCountElement) {
                recordsCountElement.textContent = `Найдено записей: ${count}`;
            }
        }
        
        function openCreateModal() {
            createModal!.style.visibility = 'visible';
            loadStudyPrograms();
            createGroupForm!.reset();
        }
        
        function closeCreateModal() {
            createModal!.style.visibility = 'hidden';
            createGroupForm!.reset();
        }
        
        function openUpdateModal(groupId, groupNumber, studyProgramId) {
            updateModal!.style.visibility = 'visible';
            
            loadStudyPrograms().then(() => {
                updateGroupIdInput!.value = groupId;
                updateGroupNumberInput!.value = groupNumber;
                const programIdNumber = parseInt(studyProgramId);
                if (programIdNumber > 0) {
                    updateStudyProgramSelect!.value = programIdNumber.toString();
                } else {
                    updateStudyProgramSelect!.value = "";
                }
            });
        }
        
        function closeUpdateModal() {
            updateModal!.style.visibility = 'hidden';
            updateGroupForm!.reset();
        }
        
        function showLoading() {
            tableBody!.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center;">
                        Загрузка данных...
                    </td>
                </tr>
            `;
        }
        
        function showNoData() {
            tableBody!.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center;">
                        Нет данных для отображения
                    </td>
                </tr>
            `;
            updateRecordsCount(0);
        }

        function runOnStart() {
            console.debug("aboba");
            loadGroups();
            
            addBtn!.addEventListener('click', openCreateModal);
            
            cancelCreateBtn!.addEventListener('click', closeCreateModal);
            
            cancelUpdateBtn!.addEventListener('click', closeUpdateModal);
            
            window.addEventListener('click', (event) => {
                if (event.target === createModal) {
                    closeCreateModal();
                }
                if (event.target === updateModal) {
                    closeUpdateModal();
                }
            });
            
            createGroupForm!.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                const groupNumber = groupNumberInput!.value.trim();
                const studyProgramId = parseInt(studyProgramSelect!.value);
                
                if (!groupNumber) {
                    alert('Пожалуйста, введите номер группы');
                    return;
                }
                
                if (!studyProgramId) {
                    alert('Пожалуйста, выберите направление');
                    return;
                }
                
                const groupData = {
                    groupNumber: groupNumber,
                    studyProgramId: studyProgramId
                };
                
                await createGroup(groupData);
            });
            
            updateGroupForm!.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                const groupId = updateGroupIdInput!.value;
                const groupNumber = updateGroupNumberInput!.value.trim();
                const studyProgramId = parseInt(updateStudyProgramSelect!.value);
                
                if (!groupNumber) {
                    alert('Пожалуйста, введите номер группы');
                    return;
                }
                
                if (!studyProgramId) {
                    alert('Пожалуйста, выберите направление');
                    return;
                }
                
                const groupData = {
                    groupNumber: groupNumber,
                    studyProgramId: studyProgramId
                };
                
                await updateGroup(groupId, groupData);
            });
        }
        
        if (document.readyState !== 'loading') {
            runOnStart();
        } else {
            document.addEventListener('DOMContentLoaded', runOnStart);
        }
    }, []);
    
    return (
        <>
            <div className="main-container">
                    <h1 className="text-bold">Список групп</h1>
                    <div className="p-block-with-padding text" id="recordsCount">
                        Найдено записей: 0
                    </div>

                    <div>
                        <div className="table-wrapper">
                        <table className="table-container">
                            <thead>
                                <tr>
                                    <th>Номер группы</th>
                                    <th>Название направления</th>
                                    <th>Курс</th>
                                    <th>Шифр направления</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody id="tableBody">
                            </tbody>
                        </table>
                        </div>
                    </div>

                    <div className="p-block-with-padding">
                        <button className="btn btn-blue" id="addBtn">Добавить</button>
                    </div>
                </div>
                <div id="createGroupModal" className="p-modal-container">
                    <div>
                        <h2 className="text-bold">Создание новой группы</h2>

                        <form id="createGroupForm">
                            <div>
                                <p style={{margin: "8px 0"}} className="text">Номер группы:</p>
                                <input type="text" id="groupNumber" className="input-field" required 
                                       placeholder="Например: 123-456" />
                            </div>

                            <div className="p-block-with-padding">
                                <p style={{margin: "8px 0"}} className="text">Направление:</p>
                                <div className="dropdown-container">
                                    <select id="studyProgram" className="dropdown-header" required>
                                        <option className="dropdown-item text" value="">Выберите направление</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between", gap: "8px"}}>
                                <button type="button" className="btn btn-red" id="cancelBtn">Отмена</button>
                                <button type="submit" className="btn btn-blue" id="saveBtn">Создать</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div id="updateGroupModal" className="p-modal-container">
                    <div>
                        <h2 className="text-bold">Редактирование группыы</h2>

                        <form id="updateGroupForm">
                            <input type="hidden" id="updateGroupId" />

                            <div>
                                <p style={{margin: "8px 0"}} className="text">Номер группы:</p>
                                <input type="text" id="updateGroupNumber" className="input-field" required 
                                       placeholder="Например: 123-456" />
                            </div>

                            <div className="p-block-with-padding">
                                <p style={{margin: "8px 0"}} className="text">Направление:</p>
                                <div className="dropdown-container">
                                    <select id="updateStudyProgram" className="dropdown-header" required>
                                        <option className="dropdown-item text" value="">Выберите направление</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between", gap: "8px"}}>
                                <button type="button" className="btn btn-red" id="cancelUpdateBtn">Отмена</button>
                                <button type="submit" className="btn btn-blue" id="updateBtn">Создать</button>
                            </div>
                        </form>
                    </div>
                </div>
        </>
    );
}