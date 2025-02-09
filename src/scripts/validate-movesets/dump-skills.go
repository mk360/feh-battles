package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
)

type SkillData struct {
	MoveType   string `json:"MoveType"`
	WeaponType string `json:"WeaponType"`
}

type SkillStructResponse struct {
	SkillData
	Name string `json:"name"`
}

type SkillStruct struct {
	Cargoquery []struct {
		Title SkillStructResponse `json:"title"`
	} `json:"cargoquery"`
}

func dumpSkills() {
	var jsonStruct = make(map[string]SkillData)
	var offset int = 0
	var query = url.Values{
		"format":  []string{"json"},
		"action":  []string{"cargoquery"},
		"tables":  []string{"Skills, UnitSkills"},
		"fields":  []string{"Skills.Name=Name, CanUseMove = MoveType, CanUseWeapon = WeaponType"},
		"where":   []string{"Exclusive = false"},
		"join_on": []string{"Skills.WikiName = UnitSkills.skill"},
		"limit":   []string{strconv.Itoa(500)},
	}

	for {
		query.Set("offset", strconv.Itoa(offset))
		var res, _ = http.Get("https://feheroes.fandom.com/api.php?" + query.Encode())
		var byteData, _ = io.ReadAll(res.Body)
		var responseStruct = SkillStruct{}
		json.Unmarshal(byteData, &responseStruct)

		for _, skill := range responseStruct.Cargoquery {
			jsonStruct[skill.Title.Name] = SkillData{
				WeaponType: skill.Title.WeaponType,
				MoveType:   skill.Title.MoveType,
			}
		}

		if len(responseStruct.Cargoquery) == 500 {
			offset += 500
		} else {
			break
		}
	}

	var converted, _ = json.Marshal(jsonStruct)

	os.WriteFile("dump.json", converted, 0644)
}
