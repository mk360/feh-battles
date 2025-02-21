package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"slices"
	"strings"
	"sync"
)

type BaseMoveset struct {
	Weapons []struct {
		Name  string `json:"name"`
		Might int    `json:"might"`
	} `json:"weapons"`

	Assists []struct {
		Name string `json:"name"`
	} `json:"assists"`

	Specials []struct {
		Name string `json:"name"`
	} `json:"specials"`

	A []struct {
		Name string `json:"name"`
	} `json:"A"`

	B []struct {
		Name string `json:"name"`
	} `json:"B"`

	C []struct {
		Name string `json:"name"`
	} `json:"C"`

	S []struct {
		Name string `json:"name"`
	} `json:"S"`
}

type Moveset struct {
	ExclusiveSkills BaseMoveset `json:"exclusiveSkills"`
	CommonSkills    BaseMoveset `json:"commonSkills"`
}

type UnitRes struct {
	Cargoquery []struct {
		Title struct {
			MoveType   string `json:"MoveType"`
			WeaponType string `json:"WeaponType"`
		} `json:"title"`
	} `json:"cargoquery"`
}

func validateMoveset(filePath string, heroName string, skillsStruct *map[string]SkillData, subset *[]string, wg *sync.WaitGroup) {
	var movesetData, _ = os.ReadFile(filePath)
	var movesetStruct Moveset = Moveset{}
	json.Unmarshal(movesetData, &movesetStruct)
	var fullSkillList = make([]string, len(movesetStruct.CommonSkills.Weapons)+
		len(movesetStruct.CommonSkills.Assists)+
		len(movesetStruct.CommonSkills.Specials)+
		len(movesetStruct.CommonSkills.A)+
		len(movesetStruct.CommonSkills.B)+
		len(movesetStruct.CommonSkills.C)+
		len(movesetStruct.CommonSkills.S)+
		len(movesetStruct.ExclusiveSkills.Weapons)+
		len(movesetStruct.ExclusiveSkills.Assists)+
		len(movesetStruct.ExclusiveSkills.Specials)+
		len(movesetStruct.ExclusiveSkills.A)+
		len(movesetStruct.ExclusiveSkills.B)+
		len(movesetStruct.ExclusiveSkills.C))
	var query = url.Values{
		"action": []string{"cargoquery"},
		"format": []string{"json"},
		"tables": []string{"Units"},
		"fields": []string{"MoveType, WeaponType"},
		"where":  []string{"_pageName = \"" + heroName + "\""},
	}
	var res, _ = http.Get("https://feheroes.fandom.com/api.php?" + query.Encode())
	var byteData, _ = io.ReadAll(res.Body)
	var unitStruct = UnitRes{}
	json.Unmarshal(byteData, &unitStruct)

	var i int16 = 0
	for _, skill := range movesetStruct.ExclusiveSkills.Weapons {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.ExclusiveSkills.Assists {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.ExclusiveSkills.Specials {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.ExclusiveSkills.A {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.ExclusiveSkills.B {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.ExclusiveSkills.C {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.ExclusiveSkills.S {
		fullSkillList[i] = skill.Name
		i++
	}

	for _, skill := range movesetStruct.CommonSkills.Weapons {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.CommonSkills.Assists {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.CommonSkills.Specials {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.CommonSkills.A {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.CommonSkills.B {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.CommonSkills.C {
		fullSkillList[i] = skill.Name
		i++
	}
	for _, skill := range movesetStruct.CommonSkills.S {
		if !slices.Contains(fullSkillList, skill.Name) {
			fullSkillList[i] = skill.Name
			i++
		}
	}

	fullSkillList = fullSkillList[0:i]

	var jsonRef = *skillsStruct

	for _, skill := range fullSkillList {
		var skillData, exists = jsonRef[skill]

		if exists {
			var isWeaponCompatible = strings.Contains(skillData.WeaponType, unitStruct.Cargoquery[0].Title.WeaponType)
			var isMoveCompatible = strings.Contains(skillData.MoveType, unitStruct.Cargoquery[0].Title.MoveType)
			if !isWeaponCompatible || !isMoveCompatible {
				fmt.Println(heroName + " shouldn't learn " + skill)
			}
		}
	}

	for _, skill := range *subset {
		var skillData, _ = jsonRef[skill]
		var isWeaponCompatible = strings.Contains(skillData.WeaponType, unitStruct.Cargoquery[0].Title.WeaponType)
		var isMoveCompatible = strings.Contains(skillData.MoveType, unitStruct.Cargoquery[0].Title.MoveType)
		var skillIsIncluded = slices.Contains(fullSkillList, skill)
		if isWeaponCompatible && isMoveCompatible && !skillIsIncluded {
			fmt.Println(heroName + " should learn " + skill)
		}
	}

	wg.Done()
}

func main() {
	// dumpSkills()
	var jsonStruct = make(map[string]SkillData)
	var jsonByteDump, _ = os.ReadFile("dump.json")
	var jsonSubsetDump, _ = os.ReadFile("subset.json")
	var subset []string = []string{}
	json.Unmarshal(jsonSubsetDump, &subset)
	json.Unmarshal(jsonByteDump, &jsonStruct)
	movesetsPath := "../../data/movesets"
	var wg = sync.WaitGroup{}
	var dir, _ = os.ReadDir(movesetsPath)
	for _, file := range dir {
		var name = file.Name()
		wg.Add(1)
		go validateMoveset(movesetsPath+"/"+name, strings.Replace(strings.Replace(file.Name(), "_", ": ", -1), ".json", "", -1), &jsonStruct, &subset, &wg)
	}
	wg.Wait()
}
